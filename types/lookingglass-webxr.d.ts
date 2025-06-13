// lookingglass-webxr.d.ts

declare module "@lookingglass/webxr" {
  /** Configuration object you can tweak before instantiating. */
  export const LookingGlassConfig: {
    targetY: number
    targetZ: number
    targetDiam: number
    fovy: number
    // add any other fields you find you need…
  }

  /** Polyfill that patches the WebXR API for Looking Glass. */
  export class LookingGlassWebXRPolyfill {
    constructor()
  }
}
