/**
 * Shared shader patches for the Earth surface (sphere and cube meshes): night-side city lights
 * and ocean gloss, driven by uniforms owned by Geometry.
 */
export type SurfaceUniforms = { uSunDirView: { value: any }; uSurfaceFx: { value: number } };

export const SURFACE_UNIFORMS_GLSL = `
    uniform vec3 uSunDirView;
    uniform float uSurfaceFx;
`;

// Water is much bluer than red in the day texture; land, desert and ice are not
export const OCEAN_GLOSS_GLSL = `
    float waterMask = smoothstep( 1.4, 2.2, diffuseColor.b / ( diffuseColor.r + 0.01 ) );
    roughnessFactor = mix( roughnessFactor, 0.55, waterMask * uSurfaceFx );
`;

// The night texture also contains moonlit land and ice; only bright pixels are city lights
export function nightLightsGlsl(nightSample: string) {
    return `
        vec3 nightColor = ${nightSample}.rgb;
        float nightLum = dot( nightColor, vec3( 0.2126, 0.7152, 0.0722 ) );
        float cityLight = smoothstep( 0.05, 0.4, nightLum );
        float nightSide = 1.0 - smoothstep( -0.25, 0.05, dot( normal, uSunDirView ) );
        totalEmissiveRadiance *= nightColor * ( cityLight + 0.2 ) * nightSide * uSurfaceFx;
    `;
}

export const NIGHT_EMISSIVE = { emissive: 0xffd8a8, emissiveIntensity: 2.4 };
