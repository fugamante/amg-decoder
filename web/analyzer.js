const INVALID_WARNING = "Serial is required and must contain digits only.";
const SIGMA_WARNING =
  "Official Martin lookup excludes serials 900001 through 902908 from the 2002 guitar/ukulele range because they were used on Sigma-Martins in 1981-1982.";
const TAYLOR_INVALID_WARNING = "Taylor serial is required and must be digits only or the documented 4-prefix format.";
const PRS_INVALID_WARNING = "PRS set-neck serial is required and must contain digits only for this scoped rule.";
const GIBSON_INVALID_WARNING = "Gibson serial is required and must match a scoped official Gibson guitar format.";
const FENDER_INVALID_WARNING = "Fender serial is required and must match a scoped U.S.-made, Mexican-made, or Indonesian-made Fender instrument format.";
const EPIPHONE_INVALID_WARNING = "Epiphone serial is required and must match a Gibson-documented Epiphone guitar format.";
const COLLINGS_INVALID_WARNING =
  "Collings serial is required and must match the scoped official electric format or 3-5 digit acoustic records-assisted format.";

function isoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function compareDate(left, right) {
  return left.localeCompare(right);
}

export function sourceById(registry, sourceId) {
  const source = registry.sources.find((entry) => entry.id === sourceId);
  if (!source) {
    throw new Error(`Unknown source id: ${sourceId}`);
  }
  return source;
}

export function analyzeMartinSerial(serialText, martinData, sourceRegistry) {
  const serial = String(serialText ?? "").trim();
  const source = sourceById(sourceRegistry, martinData.source_id);
  const base = {
    brand: martinData.brand,
    input: {
      serial,
      normalized_serial: /^\d+$/.test(serial) ? serial : null,
    },
    sources: [
      {
        id: source.id,
        name: source.name,
        url: source.url,
        source_tier: source.source_tier,
      },
    ],
  };

  if (!serial || !/^\d+$/.test(serial)) {
    return {
      ...base,
      confidence: "unsupported",
      matched_rule: {
        id: "input.invalid_serial",
        label: "Invalid serial input",
      },
      decoded: {},
      warnings: [INVALID_WARNING],
    };
  }

  const serialNumber = Number.parseInt(serial, 10);
  const quarantine = martinData.quarantines.find(
    (entry) => serialNumber >= entry.range_start && serialNumber <= entry.range_end,
  );
  if (quarantine) {
    return {
      ...base,
      confidence: "unsupported",
      matched_rule: {
        id: quarantine.id,
        label: "Sigma-Martin quarantine",
      },
      decoded: {},
      warnings: [SIGMA_WARNING],
    };
  }

  let previousLast = 0;
  for (const row of martinData.ranges) {
    if (serialNumber <= row.last_serial) {
      return {
        ...base,
        confidence: martinData.lookup_rule.confidence,
        matched_rule: {
          id: martinData.rule_id,
          label: martinData.label,
        },
        decoded: {
          production_year: row.year,
          range_start: previousLast + 1,
          range_end: row.last_serial,
        },
        warnings: martinData.warnings.slice(0, 2),
      };
    }
    previousLast = row.last_serial;
  }

  return {
    ...base,
    confidence: "unsupported",
    matched_rule: {
      id: martinData.rule_id,
      label: martinData.label,
    },
    decoded: {},
    warnings: [
      `Serial is above the current official Martin guitar/ukulele table reviewed on ${martinData.last_reviewed}.`,
    ],
  };
}

export function analyzeTaylorSerial(serialText, taylorData, sourceRegistry) {
  const serial = String(serialText ?? "").trim();
  const source = sourceById(sourceRegistry, taylorData.source_id);
  const base = {
    brand: taylorData.brand,
    input: {
      serial,
      normalized_serial: serial || null,
    },
    sources: [
      {
        id: source.id,
        name: source.name,
        url: source.url,
        source_tier: source.source_tier,
      },
    ],
  };

  const rule = (id) => taylorData.rules.find((entry) => entry.id === id);
  const unsupported = (matchedRule, warning) => ({
    ...base,
    confidence: "unsupported",
    matched_rule: {
      id: matchedRule.id,
      label: matchedRule.label,
    },
    decoded: {},
    warnings: [warning, taylorData.warnings[0]],
  });

  if (!serial) {
    return {
      ...base,
      confidence: "unsupported",
      matched_rule: {
        id: "input.invalid_serial",
        label: "Invalid serial input",
      },
      decoded: {},
      warnings: [TAYLOR_INVALID_WARNING],
    };
  }

  const fourPrefix = /^4-(\d{3,4})$/.exec(serial);
  if (fourPrefix) {
    const matchedRule = rule("taylor.four_prefix_410.1991_1992");
    const sequence = Number.parseInt(fourPrefix[1], 10);
    const range = matchedRule.ranges.find(
      (entry) => sequence >= entry.range_start && sequence <= entry.range_end,
    );
    if (!range) {
      return unsupported(matchedRule, "4-prefix serial is outside Taylor's documented 1991-1992 410 ranges.");
    }
    return {
      ...base,
      confidence: "high",
      matched_rule: {
        id: matchedRule.id,
        label: matchedRule.label,
      },
      decoded: {
        production_year: range.year,
        sequence,
      },
      warnings: [taylorData.warnings[0]],
    };
  }

  if (!/^\d+$/.test(serial)) {
    return {
      ...base,
      confidence: "unsupported",
      matched_rule: {
        id: "input.invalid_serial",
        label: "Invalid serial input",
      },
      decoded: {},
      warnings: [TAYLOR_INVALID_WARNING],
    };
  }

  if (serial.length === 10) {
    const matchedRule = rule("taylor.current_10_digit.2009_present");
    const factory = matchedRule.factory_codes[serial[0]];
    if (!factory) {
      return unsupported(matchedRule, "Factory code is not documented for Taylor's current 10-digit format.");
    }
    const year = 2000 + Number.parseInt(`${serial[1]}${serial[6]}`, 10);
    const date = isoDate(year, Number.parseInt(serial.slice(2, 4), 10), Number.parseInt(serial.slice(4, 6), 10));
    const sequence = Number.parseInt(serial.slice(7), 10);
    if (!date) {
      return unsupported(matchedRule, "Serial contains an invalid calendar date.");
    }
    if (compareDate(date, matchedRule.start_date) < 0) {
      return unsupported(matchedRule, "Serial date is before Taylor's documented current 10-digit format start.");
    }
    if (sequence < 1) {
      return unsupported(matchedRule, "Production sequence must be greater than zero.");
    }
    return {
      ...base,
      confidence: "high",
      matched_rule: {
        id: matchedRule.id,
        label: matchedRule.label,
      },
      decoded: {
        factory,
        start_date: date,
        sequence,
      },
      warnings: [taylorData.warnings[0]],
    };
  }

  if (serial.length === 9) {
    const matchedRule = rule("taylor.nine_digit.1993_1999");
    const year = 1900 + Number.parseInt(serial.slice(0, 2), 10);
    const date = isoDate(year, Number.parseInt(serial.slice(2, 4), 10), Number.parseInt(serial.slice(4, 6), 10));
    const seriesCode = serial[6];
    const series = taylorData.series_codes[seriesCode];
    const sequence = Number.parseInt(serial.slice(7), 10);
    if (year < matchedRule.year_start || year > matchedRule.year_end) {
      return unsupported(matchedRule, "Serial year is outside Taylor's documented 1993-1999 9-digit format.");
    }
    if (!date) {
      return unsupported(matchedRule, "Serial contains an invalid calendar date.");
    }
    if (!series) {
      return unsupported(matchedRule, "Series code is not documented for this Taylor serial format.");
    }
    if (sequence < 1) {
      return unsupported(matchedRule, "Production sequence must be greater than zero.");
    }
    return {
      ...base,
      confidence: "high",
      matched_rule: {
        id: matchedRule.id,
        label: matchedRule.label,
      },
      decoded: {
        start_date: date,
        series,
        series_code: seriesCode,
        sequence,
      },
      warnings: [taylorData.warnings[0], taylorData.warnings[1]],
    };
  }

  if (serial.length === 11) {
    const matchedRule = rule("taylor.eleven_digit.2000_2009");
    const year = Number.parseInt(serial.slice(0, 4), 10);
    const date = isoDate(year, Number.parseInt(serial.slice(4, 6), 10), Number.parseInt(serial.slice(6, 8), 10));
    const seriesCode = serial[8];
    const series = taylorData.series_codes[seriesCode];
    const sequence = Number.parseInt(serial.slice(9), 10);
    if (!date) {
      return unsupported(matchedRule, "Serial contains an invalid calendar date.");
    }
    if (compareDate(date, matchedRule.start_date) < 0 || compareDate(date, matchedRule.end_date) > 0) {
      return unsupported(matchedRule, "Serial date is outside Taylor's documented 2000 through October 2009 11-digit format.");
    }
    if (!series) {
      return unsupported(matchedRule, "Series code is not documented for this Taylor serial format.");
    }
    if (sequence < 1) {
      return unsupported(matchedRule, "Production sequence must be greater than zero.");
    }
    return {
      ...base,
      confidence: "high",
      matched_rule: {
        id: matchedRule.id,
        label: matchedRule.label,
      },
      decoded: {
        start_date: date,
        series,
        series_code: seriesCode,
        sequence,
      },
      warnings: [taylorData.warnings[0], taylorData.warnings[1]],
    };
  }

  const numeric = Number.parseInt(serial, 10);
  const matchedRule = rule("taylor.pre_1993_ranges");
  const range = matchedRule.ranges.find(
    (entry) => numeric >= entry.range_start && numeric <= entry.range_end,
  );
  if (range) {
    return {
      ...base,
      confidence: "medium",
      matched_rule: {
        id: matchedRule.id,
        label: matchedRule.label,
      },
      decoded: {
        production_year: range.year,
        range_start: range.range_start,
        range_end: range.range_end,
      },
      warnings: [taylorData.warnings[0], taylorData.warnings[2]],
    };
  }

  return unsupported(matchedRule, "Serial does not match a Taylor format currently encoded from the official source.");
}

export function analyzePrsSerial(serialText, prsData, sourceRegistry) {
  const serial = String(serialText ?? "").trim();
  const source = sourceById(sourceRegistry, prsData.source_id);
  const setNeckRule = prsData.rules.find((entry) => entry.id === "prs.set_neck.approximate_ranges");
  const s2Rule = prsData.rules.find((entry) => entry.id === "prs.s2.approximate_ranges");
  const base = {
    brand: prsData.brand,
    input: {
      serial,
      normalized_serial: /^\d+$/.test(serial) ? serial : null,
      scope: prsData.implemented_scope,
    },
    sources: [
      {
        id: source.id,
        name: source.name,
        url: source.url,
        source_tier: source.source_tier,
      },
    ],
  };
  const unsupported = (rule, warning) => ({
    ...base,
    confidence: "unsupported",
    matched_rule: {
      id: rule.id,
      label: rule.label ?? "PRS unsupported case",
    },
    decoded: {},
    warnings: [warning, prsData.warnings[1], prsData.warnings[2]],
  });

  if (!serial) {
    return {
      ...base,
      confidence: "unsupported",
      matched_rule: {
        id: "input.invalid_serial",
        label: "Invalid serial input",
      },
      decoded: {},
      warnings: [PRS_INVALID_WARNING, prsData.warnings[1]],
    };
  }

  const s2Match = /^S2(\d+)$/i.exec(serial);
  if (s2Match) {
    const normalizedSerial = `S2${s2Match[1]}`;
    const serialNumber = Number.parseInt(serial.slice(1), 10);
    const quarantine = s2Rule.quarantines.find((entry) => entry.serial === normalizedSerial);
    if (quarantine) {
      return unsupported(
        { id: quarantine.id, label: "PRS S2 quarantined authority row" },
        quarantine.reason,
      );
    }
    const range = s2Rule.ranges.find(
      (entry) => serialNumber >= entry.range_start && serialNumber <= entry.range_end,
    );
    if (range) {
      return {
        ...base,
        input: {
          ...base.input,
          normalized_serial: normalizedSerial,
        },
        confidence: "high",
        matched_rule: {
          id: s2Rule.id,
          label: s2Rule.label,
        },
        decoded: {
          production_year: range.year,
          family: "S2",
          serial_number: normalizedSerial,
          range_start: `S${range.range_start}`,
          range_end: `S${range.range_end}`,
          serial_location: s2Rule.serial_location,
        },
        warnings: prsData.warnings,
      };
    }
    return unsupported(s2Rule, "Serial does not match the encoded PRS S2 sequence ranges.");
  }

  if (!/^\d+$/.test(serial)) {
    return {
      ...base,
      confidence: "unsupported",
      matched_rule: {
        id: "input.invalid_serial",
        label: "Invalid serial input",
      },
      decoded: {},
      warnings: [PRS_INVALID_WARNING, prsData.warnings[1]],
    };
  }

  const prefixCandidates = Object.keys(prsData.prefix_years)
    .filter((prefix) => serial.startsWith(prefix))
    .sort((left, right) => right.length - left.length);

  for (const quarantine of setNeckRule.quarantines) {
    const prefix = Object.entries(prsData.prefix_years).find(([, years]) => years.includes(quarantine.year))?.[0];
    if (prefix && serial.startsWith(prefix)) {
      return unsupported(
        { id: quarantine.id, label: "PRS set-neck quarantined authority row" },
        quarantine.reason,
      );
    }
  }

  for (const prefix of prefixCandidates) {
    const sequenceText = serial.slice(prefix.length);
    if (!sequenceText) {
      continue;
    }
    const sequence = Number.parseInt(sequenceText, 10);
    const allowedYears = prsData.prefix_years[prefix];
    const range = setNeckRule.ranges.find(
      (entry) =>
        allowedYears.includes(entry.year) &&
        sequence >= entry.range_start &&
        sequence <= entry.range_end,
    );
    if (range) {
      return {
        ...base,
        confidence: "high",
        matched_rule: {
          id: setNeckRule.id,
          label: setNeckRule.label,
        },
        decoded: {
          production_year: range.year,
          prefix,
          sequence,
          range_start: range.range_start,
          range_end: range.range_end,
          serial_location: setNeckRule.serial_location,
        },
        warnings: prsData.warnings,
      };
    }
  }

  return unsupported(
    setNeckRule,
    "Serial does not match the encoded PRS set-neck prefix and sequence ranges.",
  );
}

function sourceEntry(source) {
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    source_tier: source.source_tier,
  };
}

function twoDigitYear(text) {
  const yy = Number.parseInt(text, 10);
  return yy <= 26 ? 2000 + yy : 1900 + yy;
}

function dayIsValid(year, dayOfYear) {
  const max = isoDate(year, 12, 31)?.endsWith("31") && new Date(Date.UTC(year, 1, 29)).getUTCDate() === 29 ? 366 : 365;
  return dayOfYear >= 1 && dayOfYear <= max;
}

export function analyzeGibsonSerial(serialText, gibsonData, sourceRegistry) {
  const serial = String(serialText ?? "").trim().toUpperCase();
  const compact = serial.replaceAll(" ", "");
  const source = sourceById(sourceRegistry, gibsonData.source_id);
  const base = {
    brand: gibsonData.brand,
    input: {
      serial,
      normalized_serial: compact || null,
      scope: gibsonData.implemented_scope,
    },
    sources: [sourceEntry(source)],
  };
  const rule = (id) => gibsonData.rules.find((entry) => entry.id === id);
  const result = (matchedRule, confidence, decoded, warnings = gibsonData.warnings) => ({
    ...base,
    confidence,
    matched_rule: {
      id: matchedRule.id,
      label: matchedRule.label,
    },
    decoded,
    warnings,
  });
  const unsupported = (id, label, warning = GIBSON_INVALID_WARNING) => ({
    ...base,
    confidence: "unsupported",
    matched_rule: { id, label },
    decoded: {},
    warnings: [warning, gibsonData.warnings[0]],
  });

  if (!serial) {
    return unsupported("input.invalid_serial", "Invalid serial input");
  }
  if (/^[A-Z]{2,}\s?\d+$/.test(serial) && !serial.startsWith("CS")) {
    return unsupported(
      "gibson.signature.excluded",
      "Gibson artist signature format excluded",
      "Gibson states artist signature models often deviate from standard serial formats and should be checked with Gibson.",
    );
  }
  if (/^94\d{6}$/.test(compact)) {
    return result(rule("gibson.centennial_1994.94rrrrrr"), "high", {
      production_year: 1994,
      production_number: Number.parseInt(compact.slice(2), 10),
    });
  }
  const cs = /^CS(\d)(\d{3,4})$/.exec(compact);
  if (cs) {
    const sequence = Number.parseInt(cs[2], 10);
    if (sequence < 1) {
      return unsupported("input.invalid_serial", "Invalid serial input", "Custom Shop sequence must be greater than zero.");
    }
    return result(rule("gibson.custom_shop.modern_csyrrrr"), "medium", {
      production_year_digit: Number.parseInt(cs[1], 10),
      sequence,
    });
  }
  const reissue = /^([0456789])(\d)(\d{3,4})$/.exec(compact);
  if (reissue) {
    const sequence = Number.parseInt(reissue[3], 10);
    if (sequence < 1) {
      return unsupported("input.invalid_serial", "Invalid serial input", "Reissue sequence must be greater than zero.");
    }
    const modelCode = reissue[1];
    return result(rule("gibson.custom_shop.reissue.myrrrr"), "medium", {
      model_year: modelCode === "0" ? 1960 : 1950 + Number.parseInt(modelCode, 10),
      model_hint: gibsonData.model_year_codes[modelCode],
      production_year_digit: Number.parseInt(reissue[2], 10),
      sequence,
    });
  }
  const es = /^A([89])(\d)(\d{4})$/.exec(compact);
  if (es) {
    const sequence = Number.parseInt(es[3], 10);
    if (sequence < 1) {
      return unsupported("input.invalid_serial", "Invalid serial input", "ES label sequence must be greater than zero.");
    }
    const code = `A${es[1]}`;
    return result(rule("gibson.custom_shop.es_label.a8_a9"), "medium", {
      model_hint: gibsonData.es_label_codes[code],
      production_year_digit: Number.parseInt(es[2], 10),
      sequence,
    });
  }
  if (/^\d{9}$/.test(compact)) {
    const yyModel = Number.parseInt(compact.slice(0, 2), 10);
    if (yyModel >= 14 && yyModel <= 18) {
      return result(rule("gibson.usa_2014_mid_2019.yyrrrrrrr"), "medium", {
        production_year: 2000 + yyModel,
        production_number: Number.parseInt(compact.slice(2), 10),
      });
    }
    const year = twoDigitYear(`${compact[0]}${compact[4]}`);
    const day = Number.parseInt(compact.slice(1, 4), 10);
    const batch = Number.parseInt(compact[5], 10);
    const rank = Number.parseInt(compact.slice(6), 10);
    if (!dayIsValid(year, day) || rank < 1) {
      return unsupported("input.invalid_serial", "Invalid serial input", "Gibson 9-digit date format contains an invalid day or rank.");
    }
    return result(rule("gibson.usa_2005_2014_2019_present.ydddybrrr"), "high", {
      production_year: year,
      day_of_year: day,
      batch,
      rank,
    });
  }
  if (/^\d{8}$/.test(compact)) {
    const year = twoDigitYear(`${compact[0]}${compact[4]}`);
    const day = Number.parseInt(compact.slice(1, 4), 10);
    const rank = Number.parseInt(compact.slice(5), 10);
    if (!dayIsValid(year, day) || rank < 1) {
      return unsupported("input.invalid_serial", "Invalid serial input", "Gibson 8-digit date format contains an invalid day or rank.");
    }
    return result(rule("gibson.usa_1977_2005.ydddyrrr"), "high", {
      production_year: year,
      day_of_year: day,
      rank,
    });
  }
  return unsupported("input.invalid_serial", "Invalid serial input");
}

export function analyzeFenderSerial(serialText, fenderData, sourceRegistry) {
  const serial = String(serialText ?? "").trim().toUpperCase();
  const source = sourceById(sourceRegistry, fenderData.source_id);
  const base = {
    brand: fenderData.brand,
    input: {
      serial,
      normalized_serial: serial || null,
      scope: fenderData.implemented_scope,
    },
  };
  const rule = (id) => fenderData.rules.find((entry) => entry.id === id);
  const sourcesFor = (matchedRule) => [sourceEntry(sourceById(sourceRegistry, matchedRule.source_id ?? fenderData.source_id))];
  const result = (matchedRule, decoded, confidence = matchedRule.confidence) => ({
    ...base,
    confidence,
    matched_rule: {
      id: matchedRule.id,
      label: matchedRule.label,
    },
    decoded,
    warnings: fenderData.warnings,
    sources: sourcesFor(matchedRule),
  });
  const unsupported = (id, label, warning = FENDER_INVALID_WARNING) => ({
    ...base,
    confidence: "unsupported",
    matched_rule: { id, label },
    decoded: {},
    warnings: [warning, fenderData.warnings[0]],
    sources: [sourceEntry(source)],
  });
  if (!serial) {
    return unsupported("input.invalid_serial", "Invalid serial input");
  }
  if (/^V\d{4,6}$/.test(serial)) {
    const matchedRule = rule("fender.us_vintage_series.v_prefix");
    return result(matchedRule, {
      production_year_range: "1982-present",
      series_hint: "U.S. Vintage Series or American Vintage candidate",
      sequence: Number.parseInt(serial.slice(1), 10),
      required_context: "neck heel production date",
    }, "low");
  }
  const us = /^US(\d{2})(\d{6})$/.exec(serial);
  if (us) {
    const year = 2000 + Number.parseInt(us[1], 10);
    if (year < 2010 || year > 2026) {
      return unsupported("input.invalid_serial", "Invalid serial input", "US-prefix year is outside the reviewed Fender range.");
    }
    return result(rule("fender.us_2010_present.us_prefix"), {
      production_year: year,
      prefix: `US${us[1]}`,
      unit_identifier: Number.parseInt(us[2], 10),
    }, "high");
  }
  const ten = /^10\s(\d{7})$/.exec(serial);
  if (ten) {
    return result(rule("fender.us_late_2009_2010.ten_prefix"), {
      production_year_range: "late 2009-March 2010",
      sequence: Number.parseInt(ten[1], 10),
    });
  }
  const zd = /^(D?Z)(\d)(\d{5,6})$/.exec(serial);
  if (zd) {
    const prefix = `${zd[1]}${zd[2]}`;
    return result(rule("fender.us_2000_2009.z_dz_prefixes"), {
      production_year_range: String(2000 + Number.parseInt(zd[2], 10)),
      prefix,
      series_hint: zd[1] === "DZ" ? "American Deluxe" : "U.S.-made Fender",
      sequence: Number.parseInt(zd[3], 10),
    });
  }
  const mexicoHistoric = /^(M[NSZ]\d)(\d{5,6})$/.exec(serial);
  if (mexicoHistoric) {
    if (mexicoHistoric[1].startsWith("MS")) {
      return unsupported("input.invalid_serial", "Invalid serial input", "Mexico artist-model exception prefixes require a separate scoped flow.");
    }
    const matchedRule = rule("fender.mx_1990_2009.mn_mz_prefixes");
    const range = matchedRule.prefix_year_ranges[mexicoHistoric[1]];
    if (range) {
      return result(matchedRule, {
        production_year_range: range,
        prefix: mexicoHistoric[1],
        country_scope: "Mexican-made Fender instrument",
        sequence: Number.parseInt(mexicoHistoric[2], 10),
      });
    }
  }
  const mexicoModern = /^(MX\d{2})(\d{6})$/.exec(serial);
  if (mexicoModern) {
    const matchedRule = rule("fender.mx_2010_2017.mx_prefix");
    const range = matchedRule.prefix_year_ranges[mexicoModern[1]];
    if (!range) {
      return unsupported("input.invalid_serial", "Invalid serial input", "MX-prefix year is outside the reviewed Fender Mexico range.");
    }
    return result(matchedRule, {
      production_year_range: range,
      prefix: mexicoModern[1],
      country_scope: "Mexican-made Fender instrument",
      unit_identifier: Number.parseInt(mexicoModern[2], 10),
    });
  }
  const indonesia = /^(ICF?\d{2})(\d{6})$/.exec(serial);
  if (indonesia) {
    const matchedRule = rule("fender.id_2008_2012.ic_icf_prefixes");
    const range = matchedRule.prefix_year_ranges[indonesia[1]];
    if (!range) {
      return unsupported("input.invalid_serial", "Invalid serial input", "IC/ICF-prefix year is outside the reviewed Fender Indonesia range.");
    }
    return result(matchedRule, {
      production_year_range: range,
      prefix: indonesia[1],
      country_scope: "Indonesian-made Fender instrument",
      factory_scope: "Cort factory",
      unit_identifier: Number.parseInt(indonesia[2], 10),
    });
  }
  const japanJD = /^JD(\d{2})(\d{6})$/.exec(serial);
  if (japanJD) {
    return result(rule("fender.jp_2012_present.jd_context_required"), {
      prefix: `JD${japanJD[1]}`,
      serial_location: "Made in Japan serial number decal",
      required_context: "Confirm Made in Japan decal and 2012 transition-period context before dating.",
    }, "unsupported");
  }
  const decade = /^([SEN]\d)(\d{5,6})$/.exec(serial);
  if (decade) {
    const matchedRule = rule("fender.us_1976_1999.s_e_n_prefixes");
    const range = matchedRule.prefix_year_ranges[decade[1]];
    if (range) {
      return result(matchedRule, {
        production_year_range: range,
        prefix: decade[1],
        sequence: Number.parseInt(decade[2], 10),
      });
    }
  }
  const earlyRule = rule("fender.us_1950_1976.serial_ranges");
  const lPrefix = /^L(\d{5})$/.exec(serial);
  const numeric = /^\d{1,6}$/.test(serial) ? Number.parseInt(serial, 10) : null;
  const pattern = lPrefix ? "l_prefix" : numeric === null ? null : "numeric";
  const number = lPrefix ? Number.parseInt(lPrefix[1], 10) : numeric;
  if (pattern && number !== null) {
    const range = earlyRule.ranges.find(
      (entry) => entry.pattern === pattern && number >= entry.range_start && number <= entry.range_end,
    );
    if (range) {
      return result(earlyRule, {
        production_year_range: range.year_range,
        range_start: range.range_start,
        range_end: range.range_end,
      });
    }
  }
  return unsupported("input.invalid_serial", "Invalid serial input");
}

export function analyzeEpiphoneSerial(serialText, epiphoneData, sourceRegistry) {
  const serial = String(serialText ?? "").trim().toUpperCase();
  const source = sourceById(sourceRegistry, epiphoneData.source_id);
  const base = {
    brand: epiphoneData.brand,
    input: {
      serial,
      normalized_serial: serial || null,
      scope: epiphoneData.implemented_scope,
    },
    sources: [sourceEntry(source)],
  };
  const rule = (id) => epiphoneData.rules.find((entry) => entry.id === id);
  const result = (matchedRule, decoded) => ({
    ...base,
    confidence: matchedRule.confidence,
    matched_rule: {
      id: matchedRule.id,
      label: matchedRule.label,
    },
    decoded,
    warnings: epiphoneData.warnings,
  });
  const unsupported = (warning = EPIPHONE_INVALID_WARNING) => ({
    ...base,
    confidence: "unsupported",
    matched_rule: {
      id: "input.invalid_serial",
      label: "Invalid serial input",
    },
    decoded: {},
    warnings: [warning, epiphoneData.warnings[0]],
  });
  if (!serial) {
    return unsupported();
  }
  const pre2008 = /^([A-Z]{1,2})(\d{2})(\d{1,2})(\d{4})$/.exec(serial);
  if (pre2008) {
    const month = Number.parseInt(pre2008[3], 10);
    if (month < 1 || month > 12) {
      return unsupported("Epiphone serial contains an invalid production month.");
    }
    return result(rule("epiphone.regular_production.pre_2008.factory_yymm_rank"), {
      production_year: twoDigitYear(pre2008[2]),
      production_month: month,
      factory_code: pre2008[1],
      rank: Number.parseInt(pre2008[4], 10),
    });
  }
  const elite = /^([A-Z])(\d)(\d{4})$/.exec(serial);
  if (elite) {
    return result(rule("epiphone.elite_elitist.fyssss"), {
      production_year: 2000 + Number.parseInt(elite[2], 10),
      factory_code: elite[1],
      series_hint: "Elite or Elitist",
      sequence: Number.parseInt(elite[3], 10),
    });
  }
  const numeric = /^(\d{2})(\d{2})(\d{6})$/.exec(serial);
  if (numeric) {
    const month = Number.parseInt(numeric[2], 10);
    if (month < 1 || month > 12) {
      return unsupported("Epiphone numeric serial contains an invalid production month.");
    }
    return result(rule("epiphone.numeric_2008_present.yymmrrrrrr"), {
      production_year: twoDigitYear(numeric[1]),
      production_month: month,
      rank: Number.parseInt(numeric[3], 10),
    });
  }
  return unsupported();
}

export function analyzeCollingsSerial(serialText, collingsData, sourceRegistry) {
  const serial = String(serialText ?? "").trim().toUpperCase();
  const normalized = serial.replace(/[\s-]/g, "");
  const source = sourceById(sourceRegistry, collingsData.source_id);
  const base = {
    brand: collingsData.brand,
    input: {
      serial,
      normalized_serial: normalized || null,
      scope: collingsData.implemented_scope,
    },
    sources: [sourceEntry(source)],
  };
  const rule = (id) => collingsData.rules.find((entry) => entry.id === id);
  const unsupported = (warning = COLLINGS_INVALID_WARNING) => ({
    ...base,
    confidence: "unsupported",
    matched_rule: {
      id: "input.invalid_serial",
      label: "Invalid serial input",
    },
    decoded: {},
    warnings: [warning, collingsData.warnings[3]],
  });
  if (!normalized) {
    return unsupported();
  }
  const prefixes = collingsData.electric_prefixes.slice().sort((left, right) => right.length - left.length);
  for (const prefix of prefixes) {
    if (!normalized.startsWith(prefix)) {
      continue;
    }
    const match = /^(\d{2})(\d+)$/.exec(normalized.slice(prefix.length));
    if (!match) {
      continue;
    }
    const year = 2000 + Number.parseInt(match[1], 10);
    const sequence = Number.parseInt(match[2], 10);
    if (year < 2000 || year > 2026 || sequence < 1) {
      return unsupported("Collings electric year or sequence is outside the reviewed official format.");
    }
    const matchedRule = rule("collings.electric.prefix_yy_sequence");
    return {
      ...base,
      confidence: matchedRule.confidence,
      matched_rule: {
        id: matchedRule.id,
        label: matchedRule.label,
      },
      decoded: {
        production_year: year,
        model_hint: prefix,
        sequence,
      },
      warnings: [collingsData.warnings[0], collingsData.warnings[1], collingsData.warnings[3]],
    };
  }
  if (/^\d{3,5}$/.test(normalized)) {
    const matchedRule = rule("collings.acoustic.records_assisted");
    return {
      ...base,
      confidence: "unsupported",
      matched_rule: {
        id: matchedRule.id,
        label: matchedRule.label,
      },
      decoded: {
        serial_location: "Neck block",
        required_context: "Contact Collings with the serial number for exact acoustic ship-date records.",
      },
      warnings: [collingsData.warnings[2], collingsData.warnings[3]],
    };
  }
  return unsupported();
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { useGrouping: false }).format(value);
}
