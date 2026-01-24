'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

const OIL_GUIDES = {
  mpm: {
    de: 'https://www.mpmoil.de/',
    en: 'https://www.mpmoil.de/',
    tr: 'https://www.mpmoil.de/'
  },
  castrol: {
    de: 'https://www.castrol.com/de_de/germany/home/product-finder.html',
    en: 'https://www.castrol.com/de_de/germany/home/product-finder.html',
    tr: 'https://www.castrol.com/de_de/germany/home/product-finder.html'
  },
  shell: {
    de: 'https://www.shell.de/fahren-und-pflegen/motorenoele-und-schmierstoffe.html#iframe=L2RyaXZlLWFuZC1jYXJlL2VuZ2luZS1vaWxzLWFuZC1sdWJyaWNhbnRzL19qY3JfY29udGVudC9yb290L21haW4vc2VjdGlvbi9zaW1wbGUvd2ViX2NvbXBvbmVudC9saW5rcy9pdGVtMC5zdHJlYW0vMTc0ODU5ODgwMDk2OC9jOTEwZDg3N2U0NjE0NWJjMTA3NTJhMDczZGJiNTNjOGIyMjQ5NjAzL2lmcmFtZS5odG1sIy9kZS9kZS1kZQ==',
    en: 'https://www.shell.de/fahren-und-pflegen/motorenoele-und-schmierstoffe.html#iframe=L2RyaXZlLWFuZC1jYXJlL2VuZ2luZS1vaWxzLWFuZC1sdWJyaWNhbnRzL19qY3JfY29udGVudC9yb290L21haW4vc2VjdGlvbi9zaW1wbGUvd2ViX2NvbXBvbmVudC9saW5rcy9pdGVtMC5zdHJlYW0vMTc0ODU5ODgwMDk2OC9jOTEwZDg3N2U0NjE0NWJjMTA3NTJhMDczZGJiNTNjOGIyMjQ5NjAzL2lmcmFtZS5odG1sIy9kZS9kZS1kZQ==',
    tr: 'https://www.shell.de/fahren-und-pflegen/motorenoele-und-schmierstoffe.html#iframe=L2RyaXZlLWFuZC1jYXJlL2VuZ2luZS1vaWxzLWFuZC1sdWJyaWNhbnRzL19qY3JfY29udGVudC9yb290L21haW4vc2VjdGlvbi9zaW1wbGUvd2ViX2NvbXBvbmVudC9saW5rcy9pdGVtMC5zdHJlYW0vMTc0ODU5ODgwMDk2OC9jOTEwZDg3N2U0NjE0NWJjMTA3NTJhMDczZGJiNTNjOGIyMjQ5NjAzL2lmcmFtZS5odG1sIy9kZS9kZS1kZQ=='
  },
  liquiMoly: {
    de: 'https://www.liqui-moly.com/de/de/service/oelwegweiser-fuer-ihr-fahrzeug.html?srsltid=AfmBOoriSIVqJoRAa2g6ex00pL-I5CBq9Xy0Bg3WubHHLLj6dqiyGdrl#oww:/api/v2/oww/10/DEU/DEU/1/',
    en: 'https://www.liqui-moly.com/de/de/service/oelwegweiser-fuer-ihr-fahrzeug.html?srsltid=AfmBOoriSIVqJoRAa2g6ex00pL-I5CBq9Xy0Bg3WubHHLLj6dqiyGdrl#oww:/api/v2/oww/10/DEU/DEU/1/',
    tr: 'https://www.liqui-moly.com/de/de/service/oelwegweiser-fuer-ihr-fahrzeug.html?srsltid=AfmBOoriSIVqJoRAa2g6ex00pL-I5CBq9Xy0Bg3WubHHLLj6dqiyGdrl#oww:/api/v2/oww/10/DEU/DEU/1/'
  }
};

export function OilGuideLinks() {
  const t = useTranslations('BarrelOils');
  const locale = t('_locale') as 'de' | 'en' | 'tr';

  const guides = [
    { name: 'MPM', url: OIL_GUIDES.mpm[locale] || OIL_GUIDES.mpm.en },
    { name: 'Castrol', url: OIL_GUIDES.castrol[locale] || OIL_GUIDES.castrol.en },
    { name: 'Shell', url: OIL_GUIDES.shell[locale] || OIL_GUIDES.shell.en },
    { name: 'Liqui Moly', url: OIL_GUIDES.liquiMoly[locale] || OIL_GUIDES.liquiMoly.en }
  ];

  return (
    <div className='flex flex-wrap gap-2'>
      {guides.map((guide) => (
        <Button
          key={guide.name}
          variant='outline'
          size='sm'
          className='group gap-2 rounded-xl border-2 font-bold transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg'
          onClick={() => window.open(guide.url, '_blank')}
        >
          {guide.name}
          <ExternalLink className='h-3 w-3 transition-transform duration-300 group-hover:scale-110' />
        </Button>
      ))}
    </div>
  );
}
