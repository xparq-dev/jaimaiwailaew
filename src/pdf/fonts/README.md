# Sarabun font assets for local PDF export

The PDF renderer embeds the regular, semibold, italic, and semibold italic Sarabun TTF files so Thai text works without a runtime font request.

- Source: Google Fonts repository, `ofl/sarabun`
- License: SIL Open Font License 1.1; see `OFL.txt`
- Generated VFS module: `sarabun-vfs.ts`
- Regenerate after an intentional font update: `npm run pdf:fonts`

Do not load these fonts from a CDN during report generation. Local embedding is part of the product's privacy and offline guarantees.
