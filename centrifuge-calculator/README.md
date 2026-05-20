# Centrifuge Adapter Calculator

Static web app for correcting centrifuge settings when 1.5 ml tubes sit inside swing-bucket adapters.

## Calculation

```text
RCF = 1.118e-5 * radius_cm * RPM^2
effective_radius = full_rotor_radius - adapter_offset
RPM = sqrt(target_RCF / (1.118e-5 * effective_radius))
RCF_setting = target_RCF * full_rotor_radius / effective_radius
```

Default centrifuges:

| Centrifuge | Full radius | Offset | Effective radius | 850 x g RPM | 850 x g RCF setting |
| --- | ---: | ---: | ---: | ---: | ---: |
| Larger | 17.5 cm | 8.0 cm | 9.5 cm | 2829 | 1566 x g |
| Smaller | 14.5 cm | 8.0 cm | 6.5 cm | 3424 | 1896 x g |

## Open

Open `index.html` in a browser, or serve the folder with any static file server.

For iPhone use from the Files app or AirDrop, `iphone-standalone.html` is the safest single-file version. It has the CSS and JavaScript embedded, but iOS file previews are not a reliable way to run interactive JavaScript.

For a local iPhone Home Screen app that works offline, use the full folder as a PWA:

1. Host this folder once from an HTTPS URL, for example GitHub Pages, Netlify, Cloudflare Pages, or another static HTTPS host.
2. Open `index.html` from that HTTPS URL in Safari on the iPhone.
3. Use Share -> Add to Home Screen.
4. Launch the Home Screen icon once while still connected so the service worker can cache the app.
5. After that, the calculator should open from the Home Screen without internet.

A same-Wi-Fi `http://Mac-IP:port` server is useful for testing, but iOS Safari generally requires HTTPS for service-worker offline caching.
