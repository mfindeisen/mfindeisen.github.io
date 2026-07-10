export interface Photo {
    src: string;
    isPhotosphere: boolean;
    caption: string;
}

export interface Place {
    id: string;
    name: string;
    coordinates: [number, number];
    description: string;
    visitDate: string;
    type: string;
    importance: string;
    photos: Photo[];
    stories: string[];
}

export const places: Place[] = [
    {
        id: 'erbil-citadel',
        name: 'Erbil Citadel',
        coordinates: [44.0092, 36.1911],
        description: 'One of the oldest continuously inhabited places in the world, dating back over 6,000 years.',
        visitDate: 'October 2022 - November 2024',
        type: 'historic_site',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/erbil_citadel_1.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_citadel_2.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_citadel_3.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_citadel_4.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_citadel_5.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_citadel_6.jpg',
                isPhotosphere: false,
                caption: ''
            }
        ],
        stories: []
    },
    {
        id: 'erbil-arab_quater',
        name: 'Erbil Arab Quater',
        coordinates: [44.0122778, 36.1893889],
        description: '',
        visitDate: 'October 2023',
        type: 'historic_site',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/erbil_arab_quarter_360_1.jpg',
                isPhotosphere: true,
                caption: '360° view of Erbil Arab Quater'
            },
            {
                src: 'textures/photos/erbil_arab_quarter_360_2.jpg',
                isPhotosphere: true,
                caption: '360° view of Erbil Arab Quater'
            },
            {
                src: 'textures/photos/erbil_arab_quarter_3.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_4.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_5.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_6.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_7.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_8.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_9.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_10.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_11.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_12.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_13.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_14.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_15.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_arab_quarter_16.jpg',
                isPhotosphere: false,
                caption: ''
            }
        ],
        stories: ["test story"]
    },
    {
        id: 'erbil-jalil-khayat-mosque',
        name: 'Erbil Jalil Khayat Mosque',
        coordinates: [44.018547, 36.201065],
        description: 'A beautiful mosque in Erbil, Iraq.',
        visitDate: 'October 2022 - November 2024',
        type: 'historic_site',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/erbil_mosque_1.jpg',
                isPhotosphere: false,
                caption: ''
            },
            {
                src: 'textures/photos/erbil_mosque_2.jpg',
                isPhotosphere: false,
                caption: ''
            }
        ],
        stories: []
    }
];
