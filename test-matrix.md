# Legacy Gibson Prototype Test Matrix

Source: local polished Gibson serial-number rules document.

This matrix captures the documented examples plus representative edge cases for the C++ decoder. It is intentionally focused on the rules in the current document, not a complete Gibson factory-history reference.

## Documented Valid Examples

| Serial | Expected format | Key expected fields |
| --- | --- | --- |
| `7 5123` | 1952-1960 Reissue | model year 1957, production year 2005, sequence 123 |
| `050102` | 1961-1969 Firebird/Les Paul/SG Reissue | production year 2005, sequence 10, model SG Standard |
| `030084` | 1961-1969 Firebird/Les Paul/SG Reissue | production year 2003, sequence 8, model 1964 Firebird III |
| `A-38005` | Historic ES Model | model year 1963, production year 1998, sequence 5 |
| `91418009` | Carved Top Model | production year 1998, day 141, sequence 9 |
| `20045002` | Carved Top Model | production year 2005, day 4, sequence 2 |
| `CS10845` | Custom Shop Regular Production Model | production year 2001, rank 845 |
| `ACE 123` | Custom Shop Signature Model | model code ACE, sequence 123 |
| `BONE 123` | Custom Shop Signature Model | model code BONE, sequence 123 |

## Additional Valid Coverage

| Serial | Expected format | Reason |
| --- | --- | --- |
| `75123` | 1952-1960 Reissue | Same rule without the optional space |
| `97 5123` | Invalid | Prevents accidental acceptance of an extra year digit in the model-year slot |
| `971231` | 1961-1969 Firebird/Les Paul/SG Reissue | Confirms 1990s two-digit production year pivot |
| `B-99001` | Historic ES Model | Confirms B-prefix 1959 ES-355 rule |
| `93666001` | Carved Top Model | Confirms day 366 is accepted for a leap-year production date |
| `AS 0001` | Custom Shop Signature Model | Confirms four-digit signature sequences |
| `JP123` | Custom Shop Signature Model | Confirms no-space signature format |
| `PF5123` | Custom Shop Signature Model | Confirms PF LP Special code with embedded production-year digit |
| `13xxx` | Not executable as literal input | The rule means `13` plus three digits, such as `13001` |
| `13001` | Custom Shop Signature Model | Confirms Gary Rossington SG numeric code |

## Invalid Coverage

| Serial | Expected result | Reason |
| --- | --- | --- |
| empty input | Invalid | No serial number supplied |
| `A-38005Z` | Invalid | Extra trailing character |
| `A-39000` | Invalid | Sequence zero should not represent a production position |
| `050107` | Invalid | Model code `7` is not listed |
| `90000001` | Invalid | Carved top day zero |
| `93669001` | Invalid | Carved top day 366 on a non-leap production year |
| `93679001` | Invalid | Carved top day greater than 366 |
| `CS10000` | Invalid | Production rank zero |
| `ACE 000` | Invalid | Signature sequence zero |
| `AS 0000` | Invalid | Signature sequence zero |
| `abcdef` | Invalid | Does not match a documented serial format |
