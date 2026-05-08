import localFont from 'next/font/local'

export const sfUIText = localFont({
  src: [
    {
      path: '../assets/fonts/SFUIText-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SFUIText-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SFUIText-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SFUIText-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SFUIText-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sf',
  display: 'swap',
})
