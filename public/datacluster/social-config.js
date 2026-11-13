export const SOCIALS = Object.freeze([
  { id:'x', label:'X / Twitter', file:'x_icon.svg', href:'https://x.com/ubernatural' },
  { id:'linkedin', label:'LinkedIn', file:'linkedin_icon.svg', href:'https://www.linkedin.com/in/ivan-shmalenko-sean/' },
  { id:'instagram', label:'Instagram', file:'insta_icon.svg', href:'https://www.instagram.com/ubernatural.io/' },
]);
export const LOGO = Object.freeze({ size:4.8, extent:90, depth:13, bevel:1.15, desktop:32000, mobile:18000, hoverScatter:.7, morphSeconds:1.4 });
export const socialIndex = index => ((index % SOCIALS.length) + SOCIALS.length) % SOCIALS.length;
// The settled order of the endless track: selected network in the middle.
export function socialSlots(index) {
  return [socialIndex(index-1),socialIndex(index),socialIndex(index+1)];
}
export function socialPose(time, x, y, reduced=false) {
  return reduced ? { x:.06, y:-.22 } : { x:.06-y*.17+Math.sin(time*.27)*.015, y:-.22+x*.3+Math.sin(time*.23)*.025 };
}
