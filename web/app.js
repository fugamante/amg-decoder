import {
  analyzeCollingsSerial,
  analyzeEpiphoneSerial,
  analyzeFenderSerial,
  analyzeGibsonSerial,
  analyzeMartinSerial,
  analyzePrsSerial,
  analyzeTaylorSerial,
  formatNumber,
} from "./analyzer.js";

const paths = {
  manifest: "../data/active-brands.json",
  martin: "../data/brands/martin/ranges.json",
  taylor: "../data/brands/taylor/rules.json",
  prs: "../data/brands/prs/rules.json",
  gibson: "../data/brands/gibson/rules.json",
  fender: "../data/brands/fender/rules.json",
  epiphone: "../data/brands/epiphone/rules.json",
  collings: "../data/brands/collings/rules.json",
  registry: "../data/source-registry.json",
};

const brandConfig = {
  martin: {
    title: "Martin serial analyzer",
    subtitle: "Standard guitar and ukulele production-year lookup.",
    help: "Digits only for Martin standard guitar and ukulele lookup.",
    samples: [
      { label: "Supported", serial: "2935987", description: "Use supported Martin sample serial 2935987" },
      { label: "Quarantine", serial: "900001", description: "Use Sigma-Martin quarantine sample serial 900001" },
      { label: "Above table", serial: "3043481", description: "Use above-table Martin sample serial 3043481" },
    ],
    scope: {
      primary: "Standard guitars and ukuleles",
      secondaryLabel: "Current table",
      secondary: "1898-2025",
      tertiaryLabel: "Separate tables",
      tertiary: "LX, Backpacker, mandolin, ukulele variants",
    },
  },
  taylor: {
    title: "Taylor serial analyzer",
    subtitle: "Official 10, 9, 11, 4-prefix, and pre-1993 serial rules.",
    help: "Digits only, except Taylor's documented 4-prefix format such as 4-1121.",
    samples: [
      { label: "10-digit", serial: "1107064001", description: "Use Taylor 10-digit sample serial 1107064001" },
      { label: "9-digit", serial: "980311301", description: "Use Taylor 9-digit sample serial 980311301" },
      { label: "4-prefix", serial: "4-1121", description: "Use Taylor 4-prefix sample serial 4-1121" },
    ],
    scope: {
      primary: "Taylor documented serial formats",
      secondaryLabel: "Implemented",
      secondary: "10-digit, 9-digit, 11-digit, 4-prefix",
      tertiaryLabel: "Range support",
      tertiary: "Published pre-1993 ranges except ambiguous 1977 transition",
    },
  },
  prs: {
    title: "PRS serial analyzer",
    subtitle: "Official PRS set-neck and S2 approximate sequence ranges.",
    help: "Digits for set-neck serials, or S2-prefix serials, located on the back of the headstock.",
    samples: [
      { label: "Set-neck", serial: "24375043", description: "Use PRS set-neck 2024 sample serial 24375043" },
      { label: "S2", serial: "S2071820", description: "Use PRS S2 2024 sample serial S2071820" },
      { label: "2023 hold", serial: "2335906", description: "Use PRS set-neck 2023 quarantined sample serial 2335906" },
    ],
    scope: {
      primary: "PRS set-neck and S2 models only",
      secondaryLabel: "Implemented",
      secondary: "Set-neck year prefix and S2 serial ranges",
      tertiaryLabel: "Separate flows needed",
      tertiary: "CE, SE, EG, Swamp Ash, bass, acoustic, amps, cabinets",
    },
  },
  gibson: {
    title: "Gibson serial analyzer",
    subtitle: "Official Gibson guitar serial formats with Custom Shop scope warnings.",
    help: "Enter a Gibson USA, Acoustic, Memphis, Custom Shop, Les Paul Classic, or documented reissue serial.",
    samples: [
      { label: "USA 8-digit", serial: "91418009", description: "Use Gibson USA 8-digit sample serial 91418009" },
      { label: "USA 9-digit", serial: "000450002", description: "Use Gibson USA 9-digit sample serial 000450002" },
      { label: "Custom CS", serial: "CS10845", description: "Use Gibson Custom Shop CS sample serial CS10845" },
    ],
    scope: {
      primary: "Official Gibson guitar formats",
      secondaryLabel: "Implemented",
      secondary: "USA, Acoustic, Memphis, Custom Shop, Les Paul Classic",
      tertiaryLabel: "Excluded",
      tertiary: "Artist signature, Epiphone, Dobro, banjo, undocumented exceptions",
    },
  },
  fender: {
    title: "Fender serial analyzer",
    subtitle: "Official U.S.-made, Mexican-made, and Indonesian-made Fender ranges, plus Japan context guidance.",
    help: "Enter a scoped U.S.-made, Mexican-made, Indonesian-made, or Japan JD-context Fender serial from official Fender dating pages.",
    samples: [
      { label: "US-prefix", serial: "US17123456", description: "Use Fender US-prefix sample serial US17123456" },
      { label: "MX-prefix", serial: "MX17123456", description: "Use Fender Mexico MX-prefix sample serial MX17123456" },
      { label: "IC/ICF", serial: "ICF10123456", description: "Use Fender Indonesia ICF-prefix sample serial ICF10123456" },
      { label: "Japan JD", serial: "JD12123456", description: "Use Fender Japan JD context sample serial JD12123456" },
      { label: "MN/MZ", serial: "MZ8123456", description: "Use Fender Mexico MZ-prefix sample serial MZ8123456" },
      { label: "Z/DZ", serial: "DZ512345", description: "Use Fender American Deluxe sample serial DZ512345" },
      { label: "Early range", serial: "L23456", description: "Use Fender L-prefix sample serial L23456" },
      { label: "V-prefix", serial: "V12345", description: "Use Fender V-prefix sample serial V12345" },
    ],
    scope: {
      primary: "Scoped U.S., Mexico, Indonesia, and Japan-context Fender instruments",
      secondaryLabel: "Implemented",
      secondary: "U.S. early ranges, S/E/N, Z/DZ, V, 10, US; Mexico MN/MZ/MX; Indonesia IC/ICF; Japan JD context",
      tertiaryLabel: "Separate flows needed",
      tertiary: "Japan date decoding, Custom Shop, Korea, acoustic, amps, Mexico exceptions, Indonesia post-2012",
    },
  },
  epiphone: {
    title: "Epiphone serial analyzer",
    subtitle: "Gibson-documented Epiphone guitar serial formats.",
    help: "Enter an Epiphone regular production, Elite/Elitist, or all-numeric serial documented by Gibson.",
    samples: [
      { label: "Pre-2008", serial: "EE04091234", description: "Use Epiphone pre-2008 sample serial EE04091234" },
      { label: "Elite", serial: "T31234", description: "Use Epiphone Elite or Elitist sample serial T31234" },
      { label: "Numeric", serial: "0809123456", description: "Use Epiphone numeric sample serial 0809123456" },
    ],
    scope: {
      primary: "Gibson-documented Epiphone guitar formats",
      secondaryLabel: "Implemented",
      secondary: "Pre-2008 factory/date, Elite/Elitist, 2008-present numeric",
      tertiaryLabel: "Excluded",
      tertiary: "Factory-name mappings, Dobro, banjo, undocumented exceptions",
    },
  },
  collings: {
    title: "Collings serial analyzer",
    subtitle: "Official Collings electric serial parsing plus acoustic lookup guidance.",
    help: "Enter a Collings electric serial such as I35LC232197, or a 3-5 digit acoustic serial for contact guidance.",
    samples: [
      { label: "I-35 LC", serial: "I35LC232197", description: "Use Collings I35LC electric sample serial I35LC232197" },
      { label: "290", serial: "290181443", description: "Use Collings 290 electric sample serial 290181443" },
      { label: "Acoustic", serial: "12345", description: "Use Collings acoustic guidance sample serial 12345" },
    ],
    scope: {
      primary: "Collings electric serials and acoustic guidance",
      secondaryLabel: "Implemented",
      secondary: "Electric prefix, production-start year, sequence",
      tertiaryLabel: "Records-assisted",
      tertiary: "Acoustic exact ship date requires contacting Collings",
    },
  },
};

const state = {
  brand: "martin",
  manifest: null,
  martin: null,
  taylor: null,
  prs: null,
  gibson: null,
  fender: null,
  epiphone: null,
  collings: null,
  registry: null,
  result: null,
};

const form = document.querySelector("[data-analyzer-form]");
const input = document.querySelector("[data-serial-input]");
const resultRegion = document.querySelector("[data-result-region]");
const brandList = document.querySelector("[data-brand-list]");
const brandTitle = document.querySelector("[data-brand-title]");
const brandSubtitle = document.querySelector("[data-brand-subtitle]");
const serialHelp = document.querySelector("[data-serial-help]");
const sampleRow = document.querySelector("[data-sample-row]");
const analyzerPanel = document.querySelector("[data-analyzer-panel]");
const scopeStrip = document.querySelector("[data-scope-strip]");
const scopePrimary = document.querySelector("[data-scope-primary]");
const scopeSecondaryLabel = document.querySelector("[data-scope-secondary-label]");
const scopeSecondary = document.querySelector("[data-scope-secondary]");
const scopeTertiaryLabel = document.querySelector("[data-scope-tertiary-label]");
const scopeTertiary = document.querySelector("[data-scope-tertiary]");

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sourceLink(source) {
  if (!source?.url || !source?.name) {
    return `<span class="source-missing">Source unavailable</span>`;
  }
  return `<a class="source-link" href="${escapeText(source.url)}" target="_blank" rel="noreferrer">${escapeText(source.name)}</a>`;
}

function brandButtons() {
  return brandList.querySelectorAll("[data-brand]");
}

function renderEmpty() {
  const config = brandConfig[state.brand];
  const brandLabel = state.manifest?.active_brands.find((brand) => brand.id === state.brand)?.display_name ?? state.brand;
  resultRegion.innerHTML = `
    <section class="result-shell is-empty" aria-label="Analyzer ready">
      <div class="state-symbol" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg>
      </div>
      <div>
        <h2>Ready for a ${escapeText(brandLabel)} serial</h2>
        <p>${escapeText(config.subtitle)} Serial lookup is not authentication.</p>
      </div>
    </section>
  `;
}

function decodedFacts(result) {
  const decoded = result.decoded;
  const facts = [];
  if (decoded.production_year) {
    facts.push(["Production year", decoded.production_year]);
  }
  if (decoded.production_year_range) {
    facts.push(["Production range", decoded.production_year_range]);
  }
  if (decoded.production_year_digit !== undefined) {
    facts.push(["Production year digit", decoded.production_year_digit]);
  }
  if (decoded.start_date) {
    facts.push(["Start date", decoded.start_date]);
  }
  if (decoded.day_of_year) {
    facts.push(["Day of year", decoded.day_of_year]);
  }
  if (decoded.factory) {
    facts.push(["Factory", decoded.factory]);
  }
  if (decoded.factory_scope) {
    facts.push(["Factory scope", decoded.factory_scope]);
  }
  if (decoded.factory_code) {
    facts.push(["Factory code", decoded.factory_code]);
  }
  if (decoded.country_scope) {
    facts.push(["Country scope", decoded.country_scope]);
  }
  if (decoded.production_month) {
    facts.push(["Production month", decoded.production_month]);
  }
  if (decoded.model_year) {
    facts.push(["Model year", decoded.model_year]);
  }
  if (decoded.model_hint) {
    facts.push(["Model hint", decoded.model_hint]);
  }
  if (decoded.serial_location) {
    facts.push(["Serial location", decoded.serial_location]);
  }
  if (decoded.range_start && decoded.range_end) {
    const rangeStart =
      typeof decoded.range_start === "number" ? formatNumber(decoded.range_start) : decoded.range_start;
    const rangeEnd =
      typeof decoded.range_end === "number" ? formatNumber(decoded.range_end) : decoded.range_end;
    facts.push(["Matched range", `${rangeStart}-${rangeEnd}`]);
  }
  if (decoded.family) {
    facts.push(["Family", decoded.family]);
  }
  if (decoded.series) {
    facts.push(["Series", `${decoded.series} (${decoded.series_code})`]);
  }
  if (decoded.series_hint) {
    facts.push(["Series hint", decoded.series_hint]);
  }
  if (decoded.sequence) {
    facts.push(["Sequence", decoded.sequence]);
  }
  if (decoded.rank) {
    facts.push(["Rank", decoded.rank]);
  }
  if (decoded.batch !== undefined) {
    facts.push(["Batch", decoded.batch]);
  }
  if (decoded.production_number) {
    facts.push(["Production number", decoded.production_number]);
  }
  if (decoded.unit_identifier) {
    facts.push(["Unit identifier", decoded.unit_identifier]);
  }
  if (decoded.required_context) {
    facts.push(["Required context", decoded.required_context]);
  }
  if (decoded.prefix) {
    facts.push(["Prefix", decoded.prefix]);
  }
  return facts;
}

function resultHeading(result) {
  if (result.decoded.production_year) {
    return `Production year ${result.decoded.production_year}`;
  }
  if (result.decoded.production_year_range) {
    return `Production range ${result.decoded.production_year_range}`;
  }
  if (result.decoded.start_date) {
    return `Start date ${result.decoded.start_date}`;
  }
  return "Supported serial";
}

function renderUnsupported(result) {
  const warning = result.warnings[0] ?? "This serial is unsupported by the current rule.";
  const facts = decodedFacts(result)
    .map(([label, value]) => `
      <div>
        <dt>${escapeText(label)}</dt>
        <dd>${escapeText(value)}</dd>
      </div>
    `)
    .join("");
  const decodedRows = facts ? facts : "";
  resultRegion.innerHTML = `
    <section class="result-shell is-unsupported" aria-label="Unsupported result">
      <div class="result-heading">
        <span class="status-icon warning" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 4 3 20h18L12 4Z"/><path d="M12 9v5M12 17h.01"/></svg>
        </span>
        <div>
          <p class="eyeless-label">Unsupported</p>
          <h2>${escapeText(result.matched_rule.label)}</h2>
        </div>
      </div>
      <div class="result-grid">
        <dl class="fact-list">
          <div>
            <dt>Input serial</dt>
            <dd>${escapeText(result.input.serial || "Empty")}</dd>
          </div>
          <div>
            <dt>Matched rule</dt>
            <dd>${escapeText(result.matched_rule.id)}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>${escapeText(warning)}</dd>
          </div>
          ${decodedRows}
        </dl>
        <aside class="source-panel">
          <span>Source</span>
          ${sourceLink(result.sources[0])}
        </aside>
      </div>
    </section>
  `;
}

function renderSupported(result) {
  const facts = decodedFacts(result)
    .map(([label, value]) => `
      <div>
        <dt>${escapeText(label)}</dt>
        <dd>${escapeText(value)}</dd>
      </div>
    `)
    .join("");
  resultRegion.innerHTML = `
    <section class="result-shell is-supported" aria-label="Supported result">
      <div class="result-heading">
        <span class="status-icon success" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8"/></svg>
        </span>
        <div>
          <p class="eyeless-label">${escapeText(result.confidence)} confidence</p>
          <h2>${escapeText(resultHeading(result))}</h2>
        </div>
      </div>
      <div class="result-grid">
        <dl class="fact-list">
          ${facts}
          <div>
            <dt>Matched rule</dt>
            <dd>${escapeText(result.matched_rule.id)}</dd>
          </div>
          <div>
            <dt>Warnings</dt>
            <dd>${escapeText(result.warnings.join(" "))}</dd>
          </div>
        </dl>
        <aside class="source-panel">
          <span>Source</span>
          ${sourceLink(result.sources[0])}
        </aside>
      </div>
    </section>
  `;
}

function renderResult(result) {
  if (!result) {
    renderEmpty();
    return;
  }
  if (result.confidence === "unsupported") {
    renderUnsupported(result);
    return;
  }
  renderSupported(result);
}

function analyzeCurrentInput() {
  state.result =
    {
      martin: () => analyzeMartinSerial(input.value, state.martin, state.registry),
      taylor: () => analyzeTaylorSerial(input.value, state.taylor, state.registry),
      prs: () => analyzePrsSerial(input.value, state.prs, state.registry),
      gibson: () => analyzeGibsonSerial(input.value, state.gibson, state.registry),
      fender: () => analyzeFenderSerial(input.value, state.fender, state.registry),
      epiphone: () => analyzeEpiphoneSerial(input.value, state.epiphone, state.registry),
      collings: () => analyzeCollingsSerial(input.value, state.collings, state.registry),
    }[state.brand]();
  renderResult(state.result);
  resultRegion.focus({ preventScroll: true });
}

function renderBrandControls() {
  const config = brandConfig[state.brand];
  analyzerPanel.hidden = false;
  scopeStrip.hidden = false;
  brandTitle.textContent = config.title;
  brandSubtitle.textContent = config.subtitle;
  serialHelp.textContent = config.help;
  scopePrimary.textContent = config.scope.primary;
  scopeSecondaryLabel.textContent = config.scope.secondaryLabel;
  scopeSecondary.textContent = config.scope.secondary;
  scopeTertiaryLabel.textContent = config.scope.tertiaryLabel;
  scopeTertiary.textContent = config.scope.tertiary;
  sampleRow.innerHTML = config.samples
    .map(
      (sample) =>
        `<button type="button" data-sample="${escapeText(sample.serial)}" aria-label="${escapeText(sample.description)}">${escapeText(sample.label)}</button>`,
    )
    .join("");
  brandButtons().forEach((button) => {
    const isActive = button.dataset.brand === state.brand;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  sampleRow.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.sample;
      analyzeCurrentInput();
      input.focus();
    });
  });
}

function renderBrandNavigation() {
  brandList.innerHTML = state.manifest.active_brands
    .map((brand) => {
      const isActive = brand.id === state.brand;
      return `
        <button class="brand-row${isActive ? " is-active" : ""}" type="button" data-brand="${escapeText(brand.id)}"${isActive ? ' aria-current="true"' : ""}>
          <span class="brand-name">${escapeText(brand.display_name)}</span>
          <span class="brand-meta">${escapeText(brand.status)}</span>
        </button>
      `;
    })
    .join("");

  brandButtons().forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.brand) {
        selectBrand(button.dataset.brand);
      }
    });
  });
}

function selectBrand(brand) {
  state.brand = brand;
  state.result = null;
  input.value = "";
  renderBrandControls();
  renderEmpty();
  input.focus();
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return response.json();
}

function assertManifestAlignment() {
  const activeBrands = state.manifest.active_brands.map((brand) => brand.id);
  const configuredBrands = Object.keys(brandConfig);
  const pathBrands = Object.keys(paths).filter((brand) => !["manifest", "registry"].includes(brand));
  const excludedBrands = new Set(state.manifest.excluded_brands.map((brand) => brand.id));

  const expected = JSON.stringify([...activeBrands].sort());
  for (const [label, brands] of [
    ["brandConfig", configuredBrands],
    ["data paths", pathBrands],
  ]) {
    if (JSON.stringify([...brands].sort()) !== expected) {
      throw new Error(`Active brand manifest does not match ${label}`);
    }
  }

  for (const brand of activeBrands) {
    if (excludedBrands.has(brand)) {
      throw new Error(`Active brand manifest also excludes ${brand}`);
    }
  }

  if (brandList.querySelector("[data-brand]")) {
    throw new Error("Static brand rows should be rendered from the active brand manifest");
  }
}

async function boot() {
  [
    state.manifest,
    state.martin,
    state.taylor,
    state.prs,
    state.gibson,
    state.fender,
    state.epiphone,
    state.collings,
    state.registry,
  ] = await Promise.all([
    loadJson(paths.manifest),
    loadJson(paths.martin),
    loadJson(paths.taylor),
    loadJson(paths.prs),
    loadJson(paths.gibson),
    loadJson(paths.fender),
    loadJson(paths.epiphone),
    loadJson(paths.collings),
    loadJson(paths.registry),
  ]);
  assertManifestAlignment();
  renderBrandNavigation();
  renderBrandControls();
  renderEmpty();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    analyzeCurrentInput();
  });
  input.addEventListener("input", () => {
    if (!input.value.trim()) {
      state.result = null;
      renderEmpty();
    }
  });
}

boot().catch((error) => {
  resultRegion.innerHTML = `
    <section class="result-shell is-unsupported" aria-label="Application error">
      <h2>Analyzer data unavailable</h2>
      <p>${escapeText(error.message)}</p>
    </section>
  `;
});
