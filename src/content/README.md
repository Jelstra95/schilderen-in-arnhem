# Teksten van de website

Alle teksten van de publieke pagina's staan in deze map, één bestand per pagina:

| Bestand | Pagina |
| --- | --- |
| `cursus.ts` | `/cursussen` |
| `workshops.ts` | `/workshops` |
| `home.ts` | de startpagina `/` |
| `aanmelden.ts` | `/inschrijven` en `/bedankt` |
| `algemeen.ts` | menu, footer en de aanmeldknop onderin op mobiel |

Bedrijfsgegevens (adres, telefoon, prijs per les, lesavonden, tijden) staan niet
hier maar in `src/lib/site.ts`. De teksten halen die waarden daar op met
`${site.district}` en dergelijke, zodat ze overal hetzelfde blijven.

## Zo pas je een tekst aan

- Verander alleen wat tussen de aanhalingstekens staat.
- Een lijst met alinea's (`paragraphs: [...]`) mag je langer of korter maken.
  Elke regel tussen aanhalingstekens wordt een eigen alinea.
- Een link schrijf je als `[tekst](/pagina)` of `[tekst](mailto:adres)`.
- Een woord dat donkerder moet opvallen schrijf je als `**woord**`.
- `title` en `description` onder `meta` zijn wat Google toont in de
  zoekresultaten.
