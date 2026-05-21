// ═══════════════════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS
// ═══════════════════════════════════════════════════════════════

// 🏷️ PRODUCTOS REALES
// Agrega aquí tus productos con imágenes reales
const realProducts = [
    {
        id: 'comoda-01',
        name: 'Cómoda',
        title: 'Cómoda',
        category: 'Muebles',
        productType: 'Cava de vinos',
        materialTypes: ['Madera', 'Mañio', 'Lenga'],
        specs: {
            dimensions: {
                ancho: '80cm',
                alto: '120cm',
                largo: '45cm'
            },
            description: 'Cómoda de diseño moderno con acabados premium.'
        },
        images: [
            'catalog/1_comoda/comoda_1.webp',
            'catalog/1_comoda/comoda_2.webp',
            'catalog/1_comoda/comoda_3.webp',
            'catalog/1_comoda/comoda_4.webp',
            'catalog/1_comoda/comoda_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp: 'https://wa.me/56953706307'
        },
        feedback: 'Un producto de increíble calidad y fabricado tal cual como queríamos'
    },
    {
        id: 'veladores-de-pino-camila-y-francisca-02',
        name: 'Veladores de pino Camila y Francisca',
        title: 'Veladores de pino Camila y Francisca',
        productType: 'Veladores',
        materialTypes: ['Madera', 'Pino'],
        specs: {
            dimensions: {
                ancho: '40cm',
                alto:  '60cm',
                largo: '45cm'
            },
            description: 'Par de veladores fabricados en madera de pino. Líneas simples y diseño funcional, cada uno con cajón y compartimento inferior; destacan por sus cantos suavizados y patas elevadas, logrando una pieza equilibrada pensada especialmente para Camila y Francisca.'
        },
        images: [
            'catalog/2_veladores_camifran/veladores_camifran_1.webp',
            'catalog/2_veladores_camifran/veladores_camifran_2.webp',
            'catalog/2_veladores_camifran/veladores_camifran_3.webp',
            'catalog/2_veladores_camifran/veladores_camifran_4.webp',
            'catalog/2_veladores_camifran/veladores_camifran_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'escudo-serpiente-negra-03',
        name: 'Escudo Serpiente negra',
        title: 'Escudo Serpiente negra',
        productType: 'Trofeo',
        materialTypes: ['Madera', 'Terciado', 'Acrílico', 'Grabado láser', 'Corte láser'],
        specs: {
            dimensions: {
                ancho: '30cm',
                alto:  '35cm',
                largo: '-'
            },
            description: 'Escudo personalizado fabricado principalmente de terciado 12mm de espesor, y pintado según diseño con terminación brillante y mate. Cada pieza es cortada con precisión con corte láser. Diseño 100% personalizado y hecho a medida.'
        },
        images: [
            'catalog/3_escudo_serpiente_negra/escudo_serpiente_negra_1.webp',
            'catalog/3_escudo_serpiente_negra/escudo_serpiente_negra_2.webp',
            'catalog/3_escudo_serpiente_negra/escudo_serpiente_negra_3.webp',
            'catalog/3_escudo_serpiente_negra/escudo_serpiente_negra_4.webp',
            'catalog/3_escudo_serpiente_negra/escudo_serpiente_negra_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'letrero-bonpanier-waffers-chocolates-04',
        name: 'Letrero Bonpanier Waffers & Chocolates',
        title: 'Letrero Bonpanier Waffers & Chocolates',
        productType: 'Letrero',
        materialTypes: ['Madera', 'Pino', 'Terciado'],
        specs: {
            dimensions: {
                ancho: '30cm',
                alto:  '30cm',
                largo: '-'
            },
            description: 'Letrero corporativo fabricado en terciado, con grabado y corte láser de alta precisión. Diseñado para destacar la identidad de Bonpanier mediante un estilo elegante y cálido.'
        },
        images: [
            'catalog/4_letrero_bonpanier/letrero_bonpanier_1.webp',
            'catalog/4_letrero_bonpanier/letrero_bonpanier_2.webp',
            'catalog/4_letrero_bonpanier/letrero_bonpanier_3.webp',
            'catalog/4_letrero_bonpanier/letrero_bonpanier_4.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'stand-qr-kavana-reposteria-saludable-05',
        name: 'Stand QR Kavana Repostería saludable',
        title: 'Stand QR Kavana Repostería saludable',
        productType: 'Stand QR',
        materialTypes: ['Acrílico', 'Grabado láser', 'Corte láser'],
        specs: {
            dimensions: {
                ancho: '12cm',
                alto:  '10cm',
                largo: '-'
            },
            description: 'Simple, efectivo y de alta calidad. Fabricado en acrílico y grabado láser, asegura durabilidad y que el logo, código QR y contenido general, duren sin deteriorarse en el tiempo. Un producto para toda la vida.'
        },
        images: [
            'catalog/5_standqr_kavana/standqr_kavana_1.webp',
            'catalog/5_standqr_kavana/standqr_kavana_2.webp',
            'catalog/5_standqr_kavana/standqr_kavana_3.webp',
            'catalog/5_standqr_kavana/standqr_kavana_4.webp',
            'catalog/5_standqr_kavana/standqr_kavana_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'letrero-club-pets-quality-life-06',
        name: 'Letrero Club Pets Quality Life',
        title: 'Letrero Club Pets Quality Life',
        productType: 'Letrero',
        materialTypes: ['Madera', 'Pino', 'Terciado'],
        specs: {
            dimensions: {
                ancho: '80',
                alto:  '80',
                largo: '-'
            },
            description: 'Letrero personalizado de 80cm de diámetro, fabricado en madera de pino. El diseño incorpora corte láser para logo y letras en relieve. Cada pieza es trabajada con distintos tonos. Ideal para negocios, emprendimientos, espacios pet friendly o decoración propia y estilo artesanal contemporáneo.'
        },
        images: [
            'catalog/6_letrero_clubpets/letrero_clubpets_3.webp',
            'catalog/6_letrero_clubpets/letrero_clubpets_1.webp',
            'catalog/6_letrero_clubpets/letrero_clubpets_2.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'letrero-golden-flowers-07',
        name: 'Letrero Golden Flowers',
        title: 'Letrero Golden Flowers',
        productType: 'Letrero',
        materialTypes: ['Madera', 'Terciado', 'Grabado láser', 'Corte láser'],
        specs: {
            dimensions: {
                ancho: '30',
                alto:  '30',
                largo: '-'
            },
            description: 'Letrero personalizado para Golden Flowers, fabricado en terciado de 9 mm con acabado negro mate. Incorpora letras en relieve con terminaciones doradas y alto contraste, logrando una estética elegante, moderna y sofisticada.'
        },
        images: [
            'catalog/7_letrero_goldenflowers/letrero_goldenflowers_1.webp',
            'catalog/7_letrero_goldenflowers/letrero_goldenflowers_2.webp',
            'catalog/7_letrero_goldenflowers/letrero_goldenflowers_3.webp',
            'catalog/7_letrero_goldenflowers/letrero_goldenflowers_4.webp',
            'catalog/7_letrero_goldenflowers/letrero_goldenflowers_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'stand-qr-crematorio-cemas-08',
        name: 'Stand QR Crematorio Cemas',
        title: 'Stand QR Crematorio Cemas',
        productType: 'Stand QR',
        materialTypes: ['Acrílico', 'Grabado láser', 'Corte láser'],
        specs: {
            dimensions: {
                ancho: '4cm',
                alto:  '15cm',
                largo: '8cm'
            },
            description: 'Stand QR personalizado con base, fabricado en acrílico y cortado con láser de alta precisión. Práctico y elegante para compartir catálogos, redes sociales o información importante, manteniendo una presentación limpia, moderna y totalmente personalizada para cada marca.'
        },
        images: [
            'catalog/8_miniexhibidor_cemas/miniexhibidor_cemas_1.webp',
            'catalog/8_miniexhibidor_cemas/miniexhibidor_cemas_2.webp',
            'catalog/8_miniexhibidor_cemas/miniexhibidor_cemas_3.webp',
            'catalog/8_miniexhibidor_cemas/miniexhibidor_cemas_4.webp',
            'catalog/8_miniexhibidor_cemas/miniexhibidor_cemas_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'stand-qr-grace-is-god-09',
        name: 'Stand QR Grace Is God',
        title: 'Stand QR Grace Is God',
        productType: 'Stand QR',
        materialTypes: ['Acrílico', 'Grabado láser', 'Corte láser'],
        specs: {
            dimensions: {
                ancho: '4cm',
                alto:  '15cm',
                largo: '8cm'
            },
            description: 'Stand QR personalizado fabricado en acrílico negro brillante y cortado con láser de alta precisión. Su diseño moderno combina letras en relieve, alto contraste y un código QR integrado para compartir redes sociales o información de forma práctica, elegante y totalmente personalizada.'
        },
        images: [
            'catalog/9_standqr_graceisgod/standqr_graceisgod_1.webp',
            'catalog/9_standqr_graceisgod/standqr_graceisgod_2.webp',
            'catalog/9_standqr_graceisgod/standqr_graceisgod_3.webp',
            'catalog/9_standqr_graceisgod/standqr_graceisgod_4.webp',
            'catalog/9_standqr_graceisgod/standqr_graceisgod_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    },
    {
        id: 'trofeo-para-empresas-stli-10',
        name: 'Trofeo para Empresas STLi',
        title: 'Trofeo para Empresas STLi',
        productType: 'Trofeo',
        materialTypes: ['Madera', 'Roble Vaporizado', 'Grabado láser', 'Corte láser'],
        specs: {
            dimensions: {
                ancho: '5cm',
                alto:  '23cm',
                largo: '20cm'
            },
            description: 'Trofeo de reconocimiento personalizado para STLi, fabricado en roble y grabado con láser de alta precisión. Su diseño, inspirado en la silueta del logo de la empresa, junto a su acabado natural, entrega un galardón cálido, elegante y significativo.'
        },
        images: [
            'catalog/10_trofeo_stli/trofeo_stli_1.webp',
            'catalog/10_trofeo_stli/trofeo_stli_2.webp',
            'catalog/10_trofeo_stli/trofeo_stli_3.webp',
            'catalog/10_trofeo_stli/trofeo_stli_4.webp',
            'catalog/10_trofeo_stli/trofeo_stli_5.webp'
        ],
        contact: {
            instagram: 'https://instagram.com/andiworks.cl',
            whatsapp:  'https://wa.me/56953706307'
        }
    }
    // 📌 Agrega más productos reales aquí siguiendo el mismo formato
];

// 🖼️ PRODUCTOS PLACEHOLDER
// Se generan automáticamente para rellenar el mosaico
const placeholderCount = 0;
const placeholderProducts = Array.from({ length: placeholderCount }, (_, i) => ({
    id: `placeholder-${i + 1}`,
    name: `Producto ${i + 1}`,
    title: `Título Producto ${i + 1}`,
    category: ['Stand QR', 'Letrero', 'Muebles', 'Decoración'][i % 4],
    productType: ['Exhibidor', 'Placa', 'Repisa', 'Cava de vinos', 'Trofeo'][i % 5],
    materialTypes: [
        ['Madera', 'MDF'],
        ['Acrílico'],
        ['Grabado láser', 'MDF'],
        ['Madera', 'Lenga'],
        ['Acrílico', 'Grabado láser']
    ][i % 5],
    specs: {
        dimensions: {
            ancho: `${10 + (i % 5) * 2}cm`,
            alto: `${15 + (i % 4) * 3}cm`,
            largo: `${5 + (i % 3) * 2}cm`
        },
        description: `Producto de alta calidad elaborado con materiales premium. Ideal para uso comercial y residencial.`
    },
    images: [
        `https://picsum.photos/seed/${i}a/1200/1600`,
        `https://picsum.photos/seed/${i}b/1200/1600`,
        `https://picsum.photos/seed/${i}c/1200/1600`,
        `https://picsum.photos/seed/${i}d/1200/1600`,
        `https://picsum.photos/seed/${i}e/1200/1600`
    ],
    contact: {
        instagram: 'https://instagram.com/andiworks.cl',
        whatsapp: 'https://wa.me/56953706307'
    },
    feedback: i % 5 === 0 ? 'Un producto de increíble calidad y fabricado tal cual como queríamos' : undefined
}));

// 📦 COMBINAR TODOS LOS PRODUCTOS
const products = [...realProducts, ...placeholderProducts];