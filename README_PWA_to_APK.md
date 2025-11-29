# Convertir la PWA a APK / Android (guía rápida)

Esta guía resume pasos y opciones para convertir tu PWA a una APK (Android), ya sea usando PWABuilder (web) o TWA (Trusted Web Activity / Bubblewrap).

Requisitos (máquina de build):
- Java JDK + Android SDK/NDK, Android Studio (para builds locales con Bubblewrap).
- Node.js y npm (para usar PWABuilder CLI si lo quieres).
- Un hosting HTTPS con tu PWA publicada (o un servidor local con NGROK/HTTPS para pruebas).

Opciones recomendadas:

1) PWABuilder (rápido y sin configuración local)
 - Visita https://www.pwabuilder.com
 - Introduce la URL de tu PWA (asegúrate que `manifest.json` sea accesible y que la página esté servida sobre HTTPS).
 - Sigue el generador, elige "Android (APK)" y descarga el artefacto. PWABuilder puede generar apk/aab con TWA.

2) TWA con Bubblewrap (build local, más control)
 - Instala bubblewrap CLI
   ```bash
   npm install -g @bubblewrap/cli
   ```
 - Genera el proyecto TWA
   ```bash
   bubblewrap init --manifest=https://tudominio.com/manifest.json
   ```
 - Rellena `applicationId` (package name), firma, iconos, etc. Luego genera y construye:
   ```bash
   bubblewrap build
   ```
 - Para construir necesitarás el SDK de Android y herramientas (gradle). Bubblewrap genera un wrapper de Android Studio.

3) Requisitos para publicar en Google Play
 - Firma de la app (keystore) y/o Android App Bundle (AAB) si es requerido.
 - Digital Asset Links proveídos en `/.well-known/assetlinks.json` en tu dominio para validar TWA y permitir que el dominio sea abierto por la app sin navegador visible.

Ejemplo de `assetlinks.json` (colócalo en `https://tudominio.com/.well-known/assetlinks.json`):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.tu.organizacion.tuapp",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:..:FF"  
      ]
    }
  }
]
```

Notas rápidas:
- Asegura que `manifest.json` tenga un icono 512x512 (PNG) y que `start_url` y `scope` sean correctos.
- Para verificar tu PWA y los problemas antes de generar APK, usa https://www.pwabuilder.com o Lighthouse (Chrome DevTools).

Si quieres, puedo:
- Generar un `assetlinks.json` de ejemplo con tus datos (package name y fingerprint) si me proporcionas el package name y el SHA256 del keystore.
- Preparar los comandos específicos con Bubblewrap y ayudarte a construir el APK localmente (necesitarás Android SDK).
