import type { SVGProps } from "react";

/**
 * Mascotte HardSwork — loup original, animé en CSS pur.
 * Couleurs pilotées par variables CSS (--ink, --accent, --paper, --fur…) :
 * on change la palette sans retoucher le dessin.
 * Animations coupées si l'utilisateur a activé « réduire les animations ».
 */
const WOLF_CSS = `.wf{--fur:#7E8A98;--fur-d:#66717F;--fur-l:#EEF1F5;display:block;overflow:visible}
.wf-fur{fill:var(--fur)}.wf-fur-d{fill:var(--fur-d)}.wf-light{fill:var(--fur-l)}
.wf-ink{fill:var(--ink,#10214B)}.wf-accent{fill:var(--accent,#FFB703)}.wf-paper{fill:var(--paper,#FFF8E5)}
.wf-shadow{fill:rgba(0,0,0,.16)}
.wf-blush{fill:var(--accent,#FFB703);opacity:.35}
.wf-line{stroke:var(--ink,#10214B);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;fill:none}
.wf-arm{stroke:var(--fur);stroke-width:18;stroke-linecap:round;fill:none}
.wf-board{stroke:var(--ink,#10214B);stroke-width:4}
.wf-text{fill:var(--ink,#10214B);font-weight:900;font-size:22px;font-family:var(--font-display,'Arial Black',Impact,sans-serif)}
.wf-tail,.wf-head,.wf-sign,.wf-ear-l,.wf-ear-r,.wf-eyes{transform-box:view-box}
.wf-anim .wf-tail{transform-origin:168px 220px;animation:wf-wag 1.3s ease-in-out infinite}
.wf-anim .wf-head{transform-origin:130px 142px;animation:wf-tilt 5s ease-in-out infinite}
.wf-anim .wf-sign{transform-origin:130px 172px;animation:wf-sway 3s ease-in-out infinite}
.wf-anim .wf-ear-l{transform-origin:104px 60px;animation:wf-twitch 6s ease-in-out infinite}
.wf-anim .wf-ear-r{transform-origin:156px 60px;animation:wf-twitch-r 6s ease-in-out 3s infinite}
.wf-anim .wf-eyes{transform-origin:130px 86px;animation:wf-blink 4.5s ease-in-out infinite}
.wf-anim:hover .wf-tail{animation-duration:.45s}
.wf-anim:hover .wf-sign{animation-duration:.9s}
@keyframes wf-wag{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(11deg)}}
@keyframes wf-tilt{0%,100%{transform:rotate(0)}30%{transform:rotate(-3deg)}65%{transform:rotate(3deg)}}
@keyframes wf-sway{0%,100%{transform:rotate(-1.8deg)}50%{transform:rotate(1.8deg)}}
@keyframes wf-twitch{0%,88%,100%{transform:rotate(0)}92%{transform:rotate(-12deg)}96%{transform:rotate(3deg)}}
@keyframes wf-twitch-r{0%,88%,100%{transform:rotate(0)}92%{transform:rotate(12deg)}96%{transform:rotate(-3deg)}}
@keyframes wf-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@media (prefers-reduced-motion:reduce){.wf-anim *{animation:none!important}}`;

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & { animated?: boolean };

export function WolfMascot({ animated = true, className, ...rest }: Props) {
  return (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 290" className={`wf ${animated ? "wf-anim" : ""} ${className ?? ""}`} {...rest} role="img" aria-label="Mascotte loup HardSwork tenant une pancarte Je recrute">
<style>{WOLF_CSS}</style>
<ellipse className="wf-shadow" cx="130" cy="276" rx="74" ry="8"/>
<g className="wf-tail">
<path className="wf-fur" d="M168 226 C214 236 246 206 236 160 C226 176 220 192 206 204 C196 212 182 214 168 214 Z"/>
<path className="wf-light" d="M236 160 C233 168 230 175 226 181 C233 187 239 176 236 160 Z"/>
</g>
<path className="wf-fur" d="M92 146 C82 176 80 232 92 266 L168 266 C180 232 178 176 168 146 Z"/>
<ellipse className="wf-light" cx="130" cy="218" rx="32" ry="46"/>
<ellipse className="wf-fur-d" cx="106" cy="268" rx="20" ry="9"/>
<ellipse className="wf-fur-d" cx="154" cy="268" rx="20" ry="9"/>
<path className="wf-light" d="M88 150 Q130 176 172 150 Q150 138 130 138 Q110 138 88 150 Z"/>
<g className="wf-head">
<g className="wf-ear-l">
<path className="wf-fur" d="M84 74 C80 50 86 28 92 20 C106 28 120 42 124 56 Z"/>
<path className="wf-accent" d="M92 60 C91 46 93 36 95 32 C103 38 110 46 112 54 Z"/>
</g>
<g className="wf-ear-r">
<path className="wf-fur" d="M176 74 C180 50 174 28 168 20 C154 28 140 42 136 56 Z"/>
<path className="wf-accent" d="M168 60 C169 46 167 36 165 32 C157 38 150 46 148 54 Z"/>
</g>
<path className="wf-fur" d="M79 96 L62 108 L80 116 Z"/>
<path className="wf-fur" d="M82 110 L68 124 L90 124 Z"/>
<path className="wf-fur" d="M181 96 L198 108 L180 116 Z"/>
<path className="wf-fur" d="M178 110 L192 124 L170 124 Z"/>
<path className="wf-fur" d="M78 92 C78 62 102 50 130 50 C158 50 182 62 182 92 C182 118 166 134 148 142 C140 146 120 146 112 142 C94 134 78 118 78 92 Z"/>
<path className="wf-fur-d" d="M130 52 L123 72 L130 79 L137 72 Z"/>
<ellipse className="wf-light" cx="130" cy="116" rx="32" ry="24"/>
<ellipse className="wf-blush" cx="94" cy="108" rx="9" ry="6"/>
<ellipse className="wf-blush" cx="166" cy="108" rx="9" ry="6"/>
<path className="wf-accent" d="M123 125 Q130 143 137 125 Q130 130 123 125 Z"/>
<path className="wf-line" d="M130 114 V122"/>
<path className="wf-line" d="M114 121 Q122 131 130 122 Q138 131 146 121"/>
<path className="wf-ink" d="M119 103 Q130 96 141 103 Q139 112 130 115 Q121 112 119 103 Z"/>
<ellipse className="wf-paper" cx="125" cy="102" rx="3" ry="1.4" opacity={0.55}/>
<path className="wf-line" d="M97 72 Q108 65 119 72"/>
<path className="wf-line" d="M141 72 Q152 65 163 72"/>
<g className="wf-eyes">
<ellipse className="wf-ink" cx="108" cy="86" rx="7" ry="8.5"/>
<circle className="wf-paper" cx="110.5" cy="83" r="2.6"/>
<ellipse className="wf-ink" cx="152" cy="86" rx="7" ry="8.5"/>
<circle className="wf-paper" cx="154.5" cy="83" r="2.6"/>
</g>
</g>
<g className="wf-sign">
<path className="wf-arm" d="M98 156 Q70 160 62 180"/>
<path className="wf-arm" d="M162 156 Q190 160 198 180"/>
<rect className="wf-paper wf-board" x="46" y="176" width="168" height="78" rx="10"/>
<text className="wf-text" x="130" y="224" textAnchor="middle" textLength="140" lengthAdjust="spacingAndGlyphs">JE RECRUTE</text>
<rect className="wf-accent" x="72" y="234" width="116" height="6" rx="3"/>
<ellipse className="wf-fur" cx="57" cy="184" rx="14" ry="12"/>
<ellipse className="wf-fur" cx="203" cy="184" rx="14" ry="12"/>
</g>
</svg>
  );
}

/** Tête seule, statique : logo de la barre de navigation et petites tailles. */
export function WolfHead(props: Omit<Props, "animated" | "viewBox">) {
  return (
    <WolfMascot
      animated={false}
      viewBox="58 12 144 138"
      style={{ overflow: "hidden" }}
      aria-hidden="true"
      {...props}
    />
  );
}
