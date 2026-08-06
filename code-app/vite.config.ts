import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' -> chemins d'assets relatifs, indispensable pour GitLab Pages qui
// sert souvent le projet sous un sous-chemin (ex: /<groupe>/<projet>/) plutot
// qu'a la racine du domaine.
export default defineConfig({
  base: './',
  plugins: [react()],
})
