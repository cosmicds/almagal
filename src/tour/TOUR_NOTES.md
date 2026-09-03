# Tour notes: where the numbers and example sources come from

Working notes for the ALMAGAL tour steps in `src/tour/`. Everything the tour
asserts beyond the scientists' own copy should be traceable from here.

`steps/TourStep1-4.vue` hold the scientists' four sections, verbatim and
nothing else; they should not be edited. Everything we wrote lives on the
matching `TourStep1b-4b.vue` slides, which pair each button with a line on what
it reveals.

## Papers

- **ALMAGAL I** — S. Molinari et al., *ALMAGAL I. The ALMA evolutionary study of
  high-mass protocluster formation in the Galaxy. Presentation of the survey and
  early results*, A&A 696, A149 (2025).
  arXiv: <https://arxiv.org/abs/2503.05555> (HTML: <https://arxiv.org/html/2503.05555>)
  A&A: <https://www.aanda.org/articles/aa/full_html/2025/04/aa52702-24/aa52702-24.html>
  DOI: 10.1051/0004-6361/202452702
- **ALMAGAL II** — *ALMA data processing and pipeline*, arXiv:
  <https://arxiv.org/abs/2503.05559>, A&A:
  <https://www.aanda.org/articles/aa/full_html/2025/04/aa52703-24/aa52703-24.html>

## Exact quotes (ALMAGAL I, arXiv:2503.05555v1)

All quoted verbatim; section/figure attributions are as reported by the paper's
HTML version.

> The L/M for the two fields in Fig. 14 is ∼0.05 for AG028.5671-0.2329 and ∼26
> for AG288.9609+0.2643, respectively.

— Sect. 4.2.2. **This is the pair tour step 3 uses.** AG028.5671-0.2329 is the
top panel, AG288.9609+0.2643 the bottom.

Fig. 14 is a **morphology** comparison, not an evolutionary-stage one. The
quantity it reports is

> the ratio A_RoI/A_C-Hull between the area of the largest RoI and its convex
> hull area computed over the areas with signal above the 5σ level

— Sect. 4.2.2, defining Q5σhull. High means regular/compact, low means
irregular:

> Q5σhull ... drops to 0.5 for the more complex structure field (bottom)

— Sect. 4.2.2. And the two properties are linked, which is why step 3 can put
the pair and the L/M filters on the same page:

> The relationship of this parameter with the clump's evolutionary stage in
> Fig. 16 shows a broadly decreasing trend with L/M, indicating that the emission
> morphology of the largest emission area in each field gets more and more
> complex as the field is more evolved.

— Sect. 4.2.2.

**Do not call AG028.5671-0.2329 "quiescent."** An earlier draft of step 3 did;
it is wrong. The distinction Fig. 14 draws is regular versus complex structure,
and the clump has cores in it either way.

> Two ALMAGAL fields showing different morphologies for similar 5σ emission
> areas. The blue contours in each field correspond to the 5σ noise level, while
> the yellow polygons represent the computed convex hull for the largest RoI in
> the fields. We have Q5σhull is ∼0.85 for the field in the top map, and ∼0.5 for
> the field in the bottom map. In both plots, the red ellipse in the bottom-right
> corner is the beam. Source AG name and running number as in Table 1.

— Fig. 14 caption.

> The values of clump L/M go from ∼0.05, which is typical of early-stage
> IRDC-like clumps, to ∼450, which is common to IR-bright clumps hosting actively
> forming protostellar objects often associated with HII regions

— Sect. 3.1. Backs the "L/M is the clock" framing in step 3.

> From the evolutionary viewpoint, both the L/M and the shape of the SED for
> λ≤70 μm have been used as a broad evolutionary classification of the clumps.

— Sect. 3.1.

> This confirms that the ALMAGAL sample spans the entire path from IRDC-hosted
> clump to the Hii region phase.

— Sect. 3.1.

> The following selection criteria were adopted: i) distance < 7.5 kpc from the
> Sun to be able to resolve the target 1000 au spatial scale with the selected
> configurations setup...ii) clump masses > 500 M⊙ in the inner and 250 M⊙ in the
> outer Galaxy; and iii) surface densities Σ≥0.1 g cm⁻² threshold that is
> critical for high-mass star formation

— Sect. 3.1 (the ellipsis is in the retrieved text, so re-check against the PDF
before quoting this one publicly).

> (a) Galactic distribution of ALMAGAL target clumps are shown on the left, with
> a symbol size of ∝Log(Mc) (clump mass) and color coded by Σc (surface density),
> as determined from the Hi-GAL data (non-beam-deconvolved), reflecting the
> updated distances and physical parameters described in Sect. 3.2 and reported
> in Table 1, available at the CDS. [...] b) Lbol/Mclump plot for the 1017
> selected clumps (color-coded by Tdust) is shown on the right. Asterisks
> indicate Hi-GAL sample sources associated with Hii regions from the surveys of
> CORNISH (Purcell et al., 2013), and CORNISH-S (Irabor et al., 2023).

— Fig. 2 caption (middle elided here; full text in the paper).

> ALMA 1.38mm continuum 7m+tm2+tm1 images of a selection of ALMAGAL fields
> showing the large variety of fragmentation levels and extended emission found.
> The target AG name and running number are from cols. 2 and 1 of Table 1. The
> small red ellipse in the bottom-right corner represents the synthesized beam.

— Fig. 4 caption. Its example fields are all in our catalog, if we ever want
more of them: AG013.4582-0.0377 (#46), AG013.7869-0.2359 (#48),
AG024.5252-0.1390 (#186), AG028.3456+0.0605 (#263), AG284.0055-0.8459 (#400),
AG285.2633-0.0501 (#417), AG311.4675+0.3724 (#592), AG320.2463-0.2942 (#647).

### Unverified

A first pass at the Fig. 2 caption returned a phrase saying the HII-region
asterisks "occupy mostly the region above L/M=10". A second retrieval did not
reproduce it, so **treat it as unverified** — check the PDF before repeating it.
The tour does not rely on it; the L/M<1 and L/M>10 boundaries in the tour come
from the scientists' own text.

## Step 3 sources

Both from our catalog (`src/assets/almagal_sources.json` +
`almagal_clump_props_WWT.json`):

| | AG028.5671-0.2329 | AG288.9609+0.2643 |
|---|---|---|
| internal id | 126991 | 658676 |
| L/M (L⊙/M⊙) | 0.05 | 26.289 |
| mass (M⊙) | 8179.7 | 527.5 |
| luminosity (L⊙) | 405.9 | 13867.7 |
| dust temp (K) | 9.0 | 20.3 |
| distance (pc) | 4840 | 6260 |
| morphology | isolated | isolated |

The step text's "16 times less massive, but 34 times more luminous" is
8179.7/527.5 = 15.5 and 13867.7/405.9 = 34.2.

Careful with the word "morphology" here: both are *isolated* in the catalog's
TYPE column (the empty→isolated→simple→rich classification the scientists'
step 4 text describes), which is a different measure from the Q5σhull hull
filling factor Fig. 14 contrasts. The pair differs in Q5σhull (≈0.85 vs ≈0.5)
and in L/M (0.05 vs 26), not in TYPE. If we ever want a TYPE contrast, the
catalog has 191 empty and 77 rich clumps.

## Per-source FITS stretch

Measured off the archive images in
`~/data_storage/almagal/almagal_download_20260603202701/<iid>/<iid>_cont_7MTM2TM1_jointdeconv.image.pbcor.fits`
(all values Jy/beam; noise is the RMS of the negative pixels, which are
signal-free):

| | 126991 | 658676 |
|---|---|---|
| peak | 1.58e-2 | 2.02e-3 |
| rms | 2.05e-4 | 1.54e-4 |
| peak/rms | 77 | 13 |
| p99.9 | 1.50e-3 | 5.93e-4 |
| **tour vmin** | 2.0e-4 (1σ) | 1.5e-4 (1σ) |
| **tour vmax** | 4.0e-3 | 2.0e-3 |

The app's shared default is vmin 0, vmax 0.015 — that is fine for 126991 but
sits 7× above the *peak* of 658676, so the evolved clump renders as an empty
field with the default cut. Hence the per-source override plumbing
(`sourceStretchOverrides` in `src/almagal_state.ts`). vmin at 1σ kills the noise speckle
without eating the extended emission; both were checked by rendering the FITS
offline under the same log stretch WWT applies.

## Other numbers used by the tour

- **Mass cuts on step 4** (`filterByMass`): clump mass in our catalog runs
  11.6–12424.8 M⊙, median 805.6, p25 585, p75 1305, p90 2163. The buttons use
  ≥2000 M⊙ ("high", 118 clumps) and ≤500 M⊙ ("low"), i.e. the tails rather than
  a split at the median.
- **Stage cuts on step 3** (`filterByStage`): L/M < 1 (429 clumps), 1–10 (318),
  > 10 (270). Thresholds are the scientists' own, from the step 4 text.
- **L/M = -999** marks a missing value in the catalog. The filters pass
  `null` for an open end, and `setFilterRange` substitutes the column's measured
  minimum (which excludes -999), so those rows stay filtered out.
- **Step 2 field**: RA 164.4655, Dec -59.4909 — the AG288.9609+0.2643 field in
  the Carina arm, chosen because both DECaPS DR1 (southern plane, visible) and
  the Herschel SPIRE HiPS (Hi-GAL, far-IR) cover it. GLIMPSE 360 proper covers
  65° < l < 265°, so it is *not* a safe "infrared" button at l = 289.
- **Orion** is ~400 pc away and the nearest high-mass star-forming region;
  framing for its three bands comes from `public/orion_m42_wide.wtml` itself.
