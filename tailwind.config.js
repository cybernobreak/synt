/** Configuração do Tailwind — cores e fontes exatas que o site já usa.
 *  Não precisa editar nada aqui, só colocar este arquivo na raiz do repositório. */
module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        synth: {
          bg: '#ffffff',
          card: '#f8fafc',
          text: '#0f172a',
          muted: '#64748b',
          blue: '#1d4ed8',
          lightbl: '#eff6ff',
          border: '#e2e8f0',
          accent: '#3b82f6'
        }
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
