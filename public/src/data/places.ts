export interface PanoData {
    fullWidth: number;
    fullHeight: number;
    croppedWidth: number;
    croppedHeight: number;
    croppedX: number;
    croppedY: number;
}

export interface Photo {
    src: string;
    isPhotosphere: boolean;
    caption: string;
    /** Crop of an equirectangular panorama, in the source image's pixels. */
    panoData?: PanoData;
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
        name: 'Erbil Arab Quarter',
        coordinates: [44.0122778, 36.1893889],
        description: '',
        visitDate: 'October 2023',
        type: 'historic_site',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/erbil_arab_quarter_360_1.webp',
                isPhotosphere: true,
                caption: '360° view of Erbil Arab Quarter',
            },
            {
                src: 'textures/photos/erbil_arab_quarter_360_2.webp',
                isPhotosphere: true,
                caption: '360° view of Erbil Arab Quarter',
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
        name: 'Erbil Jalil Khayat Mosque',
        coordinates: [44.018547, 36.201065],
        description: 'A beautiful mosque in Erbil, Iraq.',
        visitDate: 'October 2022 - November 2024',
        type: 'historic_site',
        importance: 'high',
        photos: [
            { src: 'textures/photos/erbil_mosque_1.webp', isPhotosphere: false, caption: '' },
            { src: 'textures/photos/erbil_mosque_2.webp', isPhotosphere: false, caption: '' },
        ],
        stories: [],
    },
    {
        id: 'shindokha',
        name: "Shindokha",
        coordinates: [42.960278, 36.852778],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "August 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/shindokha_img_20180813_061945.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'sham-brikla',
        name: "Sham Brikla",
        coordinates: [42.735833, 36.783889],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "August 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/sham_brikla_img_20180816_085101.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'mam-shvan',
        name: "Mam Shvan",
        coordinates: [42.747469, 36.791471],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "August 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/mam_shvan_img_20180816_090143.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/mam_shvan_img_20180826_052720.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'semel-1',
        name: "Semel",
        coordinates: [42.703381, 36.798917],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "August 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/semel_area_img_20180826_080250.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/semel_area_pano_20180826_114353.webp',
                isPhotosphere: true,
                caption: "",
                panoData: {
                    fullWidth: 13818,
                    fullHeight: 6910,
                    croppedWidth: 13818,
                    croppedHeight: 2316,
                    croppedX: 0,
                    croppedY: 2065,
                },
            },
        ],
        stories: [],
    },
    {
        id: 'zinan',
        name: "Zinan",
        coordinates: [42.775556, 36.77],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "August 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/zinan_img_20180829_073258.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/zinan_img_20180829_054755.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/zinan_img_20180829_122625.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'badliya',
        name: "Badliya",
        coordinates: [42.73378, 36.850445],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/badliya_img_20180901_053118.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'kelek-hamo',
        name: "Kelek Hamo",
        coordinates: [42.709722, 36.820556],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/kelek_hamo_img_20180901_124401.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'jubaniye',
        name: "Jubaniye",
        coordinates: [42.590968, 36.817565],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/jubaniye_img_20180904_061310.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/jubaniye_img_20180904_061626.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/jubaniye_img_20180904_061733.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'jubaniye-2',
        name: "Jubaniye Ridge",
        coordinates: [42.580299, 36.831356],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/jubaniye_2_img_20180908_064145.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/jubaniye_2_img_20180908_060306.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'batel-1',
        name: "Batel",
        coordinates: [42.56385, 36.85088],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/batel_area_img_20180909_061928.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/batel_area_img-20180909-wa0032.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/batel_area_img_20180909_060653.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/batel_area_img_20180909_061332.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/batel_area_img_20180909_071152.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'khanke',
        name: "Khanke",
        coordinates: [42.720432, 36.78484],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/khanke_img_20180915_121103.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'avzrek',
        name: "Avzrek",
        coordinates: [42.629576, 36.943544],
        description: "Near Avzrek, in Duhok Governorate.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/avzrek_img_20180917_055944.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/avzrek_img_20180917_083141.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'avzrek-miri',
        name: "Avzrek Miri",
        coordinates: [42.610439, 36.959933],
        description: "Open steppe near Semel, in Duhok Governorate.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/avzrek_miri_360.webp',
                isPhotosphere: true,
                caption: "360\u00b0 view of Avzrek Miri",
                panoData: {
                    fullWidth: 9573,
                    fullHeight: 4785,
                    croppedWidth: 9573,
                    croppedHeight: 3342,
                    croppedX: 0,
                    croppedY: 1438,
                },
            },
            {
                src: 'textures/photos/avzrek_miri_img_20180917_090104.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/avzrek_miri_img_20180917_090252.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/avzrek_miri_img_20180917_093613.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'batel-2',
        name: "Batel West",
        coordinates: [42.531389, 36.8575],
        description: "Duhok Governorate, Kurdistan Region of Iraq.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/batel_area_2_img_20180922_103104.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'khirbet-qinyat-khazir',
        name: "Khirbet Qinyat Khazir",
        coordinates: [42.624608, 36.888586],
        description: "A wooded wadi near Semel, in Duhok Governorate.",
        visitDate: "September 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/khirbet_qinyat_khazir_360.webp',
                isPhotosphere: true,
                caption: "360\u00b0 view of Khirbet Qinyat Khazir",
                panoData: {
                    fullWidth: 13686,
                    fullHeight: 6842,
                    croppedWidth: 13686,
                    croppedHeight: 2338,
                    croppedX: 0,
                    croppedY: 1978,
                },
            },
            {
                src: 'textures/photos/khirbet_qinyat_khazir_img_20180923_104417.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/khirbet_qinyat_khazir_img_20180923_102718.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'asiye',
        name: "Asiye",
        coordinates: [42.7029, 37.020065],
        description: "Asiye, north of Batel in Duhok Governorate.",
        visitDate: "October 2018",
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/asiye_img_20181004_072044.webp',
                isPhotosphere: false,
                caption: "",
            },
            {
                src: 'textures/photos/asiye_img_20181004_073043.webp',
                isPhotosphere: false,
                caption: "",
            },
        ],
        stories: [],
    },
    {
        id: 'kawlokan-canyon',
        name: 'Kawlokan Canyon',
        coordinates: [44.527317, 36.617717],
        description: 'The canyon floor at Kawlokan, in the Rawanduz district.',
        visitDate: 'October 2022',
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/kawlokan_canyon_360.webp',
                isPhotosphere: true,
                caption: 'Panorama of the Kawlokan canyon',
                panoData: {
                    fullWidth: 8252,
                    fullHeight: 4126,
                    croppedWidth: 3906,
                    croppedHeight: 1622,
                    croppedX: 0,
                    croppedY: 1101,
                },
            },
        ],
        stories: [],
    },
    {
        id: 'kawlokan',
        name: 'Kawlokan',
        coordinates: [44.523997, 36.616439],
        description: 'The canyon rim at Kawlokan, in the Rawanduz district.',
        visitDate: 'November 2024',
        type: 'nature',
        importance: 'high',
        photos: [
            {
                src: 'textures/photos/kawlokan_rim_360.webp',
                isPhotosphere: true,
                caption: 'Panorama from the Kawlokan rim',
                panoData: {
                    fullWidth: 8170,
                    fullHeight: 4085,
                    croppedWidth: 4916,
                    croppedHeight: 1592,
                    croppedX: 0,
                    croppedY: 1416,
                },
            },
            {
                src: 'textures/photos/kawlokan_rim_photosphere.webp',
                isPhotosphere: true,
                caption: 'Photosphere from the Kawlokan rim',
                panoData: {
                    fullWidth: 14486,
                    fullHeight: 7243,
                    croppedWidth: 9984,
                    croppedHeight: 4058,
                    croppedX: 2220,
                    croppedY: 2516,
                },
            },
        ],
        stories: [],
    },
];
