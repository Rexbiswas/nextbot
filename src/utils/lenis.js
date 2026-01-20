import Lenis from 'lenis'

export function initLenis() {
  const lenis = new Lenis({
    autoRaf: true,
  })

  lenis.on('scroll', (e) => {
    console.log(e)
  })

  return lenis
}

