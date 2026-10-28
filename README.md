# PiiZiTV · EPG público

Solo programación en formato XMLTV. Este proyecto no contiene listas M3U, enlaces de reproducción, credenciales de proveedores ni configuración del servidor local.

La guía de base es un EPG que identifica emisoras con programación. El generador consulta exclusivamente los XMLTV públicos declarados en sources.json; no abre cuentas IPTV ni necesita ninguna contraseña. Los nombres de las emisoras y sus horarios forman parte del formato EPG.

## Uso

En Releases, abre la publicación «epg» y copia el enlace del archivo guia.xml.gz. La dirección permanece estable y funciona aunque el PC esté apagado. También se publica guia.xml para reproductores que prefieran XML sin comprimir.

La automatización se ejecuta aproximadamente cada seis horas en GitHub Actions. GitHub puede retrasar las ejecuciones programadas. Si una actualización no obtiene suficiente programación, conserva la publicación anterior.

La guía admite identificadores PiiZiTV y varias denominaciones XMLTV públicas habituales. No puede reparar identificadores ausentes o incorrectos de una lista ajena: puede seguir siendo necesaria la asociación manual en el reproductor. No garantiza programación para canales personalizados o señales cuyo proveedor no publica horarios.

## Comprobación local

Requiere Node.js 22 o posterior. No necesita dependencias externas.

    node --test test/*.test.cjs
    node generate.cjs

Los resultados se escriben en dist/. Solo se publican guia.xml, guia.xml.gz y estado.json. Los ficheros de programación no se acumulan en el historial Git; se sustituyen en la misma publicación.

Fuentes: EPGShare01, TDTChannels, IPTV-EPG.org, Open-EPG, EPG.pw, EPGTalk y los repositorios públicos de guías de Pluto TV, Samsung TV Plus y Plex. Sus direcciones concretas están en sources.json. La disponibilidad depende de cada fuente.

## Equivalencias de nombres

La versión de asociación 2 amplía los identificadores XMLTV públicos y añade nombres alternativos de emisoras en todos los países de la guía, incluyendo variantes HD, SD, FHD, UHD y 4K. Se conservan separados los canales numerados y las emisiones +1. Los nombres ambiguos entre países se omiten como equivalencias sin país para no asociar otra señal.

Los nombres alternativos pueden facilitar la búsqueda y la asociación cuando el reproductor los admite. No sustituyen un identificador ausente: una lista con NULL o un identificador erróneo puede necesitar asignación manual. No se publica ninguna lista de reproducción ni configuración de una cuenta IPTV.
