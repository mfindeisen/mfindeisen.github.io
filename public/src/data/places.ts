import type { Localized } from '../i18n/i18n.js';

export interface Photo {
    src: string;
    isPhotosphere: boolean;
    caption: Localized | string;
}

export interface Place {
    id: string;
    name: Localized;
    coordinates: [number, number];
    description: Localized;
    visitDate: Localized;
    type: string;
    importance: string;
    photos: Photo[];
    stories: string[];
}

export const places: Place[] = [
    {
        id: 'erbil-citadel',
        name: { en: 'Erbil Citadel', de: 'Zitadelle von Erbil' },
        coordinates: [44.0092, 36.1911],
        description: {
            en: 'One of the oldest continuously inhabited places in the world, dating back over 6,000 years.',
            de: 'Einer der ältesten durchgehend besiedelten Orte der Welt – über 6.000 Jahre Geschichte.',
        },
        visitDate: {
            en: 'October 2022 - November 2024',
            de: 'Oktober 2022 – November 2024',
        },
        type: 'historic_site',
        importance: 'high',
        photos: [
            { src: 'textures/photos/erbil_citadel_1.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_citadel_2.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_citadel_3.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_citadel_4.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_citadel_5.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_citadel_6.webp', isPhotosphere: false, caption: '' },
        ],
        stories: [],
    },
    {
        id: 'erbil-arab_quater',
        name: { en: 'Erbil Arab Quarter', de: 'Arabisches Viertel von Erbil' },
        coordinates: [44.0122778, 36.1893889],
        description: { en: '', de: '' },
        visitDate: { en: 'October 2023', de: 'Oktober 2023' },
        type: 'historic_site',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/erbil_arab_quarter_360_1.webp',
                isPhotosphere: true,
                caption: {
                    en: '360° view of Erbil Arab Quarter',
                    de: '360°-Ansicht des arabischen Viertels von Erbil',
                },
            },
            {
                src: 'textures/photos/erbil_arab_quarter_360_2.webp',
                isPhotosphere: true,
                caption: {
                    en: '360° view of Erbil Arab Quarter',
                    de: '360°-Ansicht des arabischen Viertels von Erbil',
                },
            },
            { src: 'textures/photos/erbil_arab_quarter_3.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_4.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_5.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_6.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_7.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_8.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_9.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_10.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_11.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_12.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_13.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_14.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_15.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_arab_quarter_16.webp', isPhotosphere: false, caption: '' },
        ],
        stories: ['test story'],
    },
    {
        id: 'erbil-jalil-khayat-mosque',
        name: { en: 'Erbil Jalil Khayat Mosque', de: 'Jalil-Khayat-Moschee in Erbil' },
        coordinates: [44.018547, 36.201065],
        description: {
            en: 'A beautiful mosque in Erbil, Iraq.',
            de: 'Eine beeindruckende Moschee in Erbil, Irak.',
        },
        visitDate: {
            en: 'October 2022 - November 2024',
            de: 'Oktober 2022 – November 2024',
        },
        type: 'historic_site',
        importance: 'high',
        photos: [
            { src: 'textures/photos/erbil_mosque_1.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_mosque_2.webp', isPhotosphere: false, caption: '' },
        ],
        stories: [],
    },
];
