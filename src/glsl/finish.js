/**
 * @module @arraypress/shaders/glsl/finish
 *
 * GLSL for the last step of every scene, `finish(colour, fragCoord)`: the
 * look's exposure, hue, saturation and tint, a soft vignette and film
 * grain, as a photo has.
 */

/** The finishing helper. */
export const FINISH_GLSL = /* glsl */ `// film grain and a soft vignette, as a photo has
vec3 finish(vec3 c, vec2 fc) {
	vec2 uv = fc / uRes;
	c *= uExposure;
	// hue turned round the grey axis, then saturation, then a tint toward a colour (keeping the light and dark)
	float l = dot(c, vec3(0.299, 0.587, 0.114));
	vec3 k = vec3(0.57735);
	float ch = cos(uHue), sh = sin(uHue);
	c = c * ch + cross(k, c) * sh + k * dot(k, c) * (1.0 - ch);
	c = mix(vec3(l), c, uSat);
	c = mix(c, uTint * l * 1.8, uTintAmt);
	c *= mix(0.72, 1.0, smoothstep(1.15, 0.35, length(uv - 0.5) * 1.4));
	c += (hash(fc + fract(uTime) * 91.0) - 0.5) * 0.035 * uGrain;
	return pow(max(c, 0.0), vec3(1.0 / 1.04));
}
`;
