/* ═════════ "¿Qué comemos hoy?" · saga de historias para Instagram ═════════
   Elegís lo que hay en la heladera y arma un plato estilo chef privado:
   principal + salsa + guarnición + toque de chef, y lo convierte en 6 placas.
   Se usa desde /admin-historias (pestaña 🧊). Sal, pimienta y aceite se dan por sentados. */
(function () {
  const ING = [
    ['Proteínas', [['pollo', '🍗', 'Pollo'], ['carne', '🥩', 'Bife o nalga'], ['picada', '🍔', 'Carne picada'], ['cerdo', '🐖', 'Cerdo (bondiola o carré)'], ['pescado', '🐟', 'Pescado blanco'], ['salmon', '🍣', 'Salmón'], ['langostinos', '🦐', 'Langostinos'], ['huevos', '🥚', 'Huevos'], ['atun', '🥫', 'Atún en lata'], ['legumbres', '🫘', 'Garbanzos o lentejas']]],
    ['Verduras y frutas', [['papa', '🥔', 'Papa'], ['batata', '🍠', 'Batata'], ['zapallo', '🎃', 'Zapallo'], ['cebolla', '🧅', 'Cebolla'], ['ajo', '🧄', 'Ajo'], ['tomate', '🍅', 'Tomate'], ['morron', '🫑', 'Morrón'], ['zucchini', '🥒', 'Zucchini'], ['berenjena', '🍆', 'Berenjena'], ['espinaca', '🥬', 'Espinaca o acelga'], ['hongos', '🍄', 'Hongos'], ['brocoli', '🥦', 'Brócoli'], ['zanahoria', '🥕', 'Zanahoria'], ['choclo', '🌽', 'Choclo'], ['palta', '🥑', 'Palta'], ['limon', '🍋', 'Limón'], ['verdeo', '🌱', 'Cebolla de verdeo'], ['hierbas', '🌿', 'Hierbas frescas']]],
    ['Lácteos', [['manteca', '🧈', 'Manteca'], ['crema', '🥛', 'Crema'], ['queso', '🧀', 'Queso rallado'], ['cremoso', '🧀', 'Queso cremoso'], ['yogur', '🥣', 'Yogur natural'], ['leche', '🥛', 'Leche']]],
    ['Despensa', [['arroz', '🍚', 'Arroz'], ['fideos', '🍝', 'Fideos'], ['pan', '🥖', 'Pan'], ['harina', '🌾', 'Harina'], ['vino', '🍷', 'Vino'], ['mostaza', '🟡', 'Mostaza'], ['miel', '🍯', 'Miel'], ['soja', '🥢', 'Salsa de soja'], ['tomate_lata', '🥫', 'Tomate en lata'], ['caldo', '🍲', 'Caldo'], ['frutos_secos', '🥜', 'Frutos secos'], ['aceitunas', '🫒', 'Aceitunas']]]
  ];
  const INFO = {}; ING.forEach(([, l]) => l.forEach(([k, e, n]) => { INFO[k] = { e, n }; }));

  /* principales: req = todos necesarios · alt = alcanza con uno · tag = con qué salsas combina */
  const PRINC = [
    { id: 'pollo-sarten', req: ['pollo'], tag: 'pollo', nombre: 'Pollo dorado a la sartén', corto: 'El pollo', pasos: ['Secá bien el pollo con papel y salpimentalo 10 minutos antes.', 'Sartén bien caliente con un hilo de aceite: apoyá el lado lindo y no lo muevas en 5 minutos.', 'Dalo vuelta, bajá el fuego y terminá tapado hasta que el centro esté bien cocido.', 'Reposo de 3 minutos antes de cortar: así no pierde los jugos.'] },
    { id: 'pollo-horno', req: ['pollo', 'limon'], tag: 'pollo', nombre: 'Pollo al horno con limón y hierbas', corto: 'El pollo', pasos: ['Masajeá el pollo con aceite, ralladura y jugo de limón, sal y pimienta.', 'Rodajas de limón y ajo debajo, piel hacia arriba en la fuente.', 'Horno fuerte, 200 °C, 35 a 45 minutos según las presas.', 'Los últimos 5 minutos, gratinador: piel bien crocante.'] },
    { id: 'pollo-wok', req: ['pollo', 'soja'], tag: 'pollo', nombre: 'Salteado de pollo al wok', corto: 'El salteado', pasos: ['Cortá el pollo en tiras finas y las verduras en bastones parejos.', 'Wok o sartén al máximo: el pollo primero, en tandas, para que dore y no hierva.', 'Sacalo, salteá las verduras 2 minutos y que queden crocantes.', 'Volvé todo a la sartén con la salsa y un minuto más de fuego.'] },
    { id: 'bife', req: ['carne'], tag: 'carne', nombre: 'Bife sellado en su punto', corto: 'El bife', pasos: ['Sacá la carne de la heladera 20 minutos antes y secala bien.', 'Sartén de hierro humeante, sal gruesa justo antes de apoyar.', '3 a 4 minutos por lado para un punto jugoso; una sola vuelta.', 'Reposo de 5 minutos sobre tabla y cortá en contra de la fibra.'] },
    { id: 'albondigas', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['picada'], alt: ['tomate_lata', 'tomate'], tag: 'picada', nombre: 'Albóndigas caseras en salsa', corto: 'Las albóndigas', pasos: ['Mezclá la carne con sal, pimienta, ajo picado y (si tenés) pan remojado en leche y un huevo.', 'Formá bolitas del mismo tamaño con las manos húmedas.', 'Doralas en sartén por todos lados: no hace falta que se cocinen adentro.', 'Terminalas 15 minutos en la salsa, a fuego bajo y tapadas.'] },
    { id: 'hamburguesa', req: ['picada'], tag: 'carne', nombre: 'Hamburguesa de autor', corto: 'La hamburguesa', pasos: ['Armá medallones de 150 g sin amasar de más; hundí apenas el centro con el pulgar.', 'Sal recién al momento de cocinar, nunca antes.', 'Plancha bien caliente: 3 minutos, vuelta y 2 minutos más.', 'Si tenés queso, arriba el último minuto y tapá para que se funda.'] },
    { id: 'cerdo', req: ['cerdo'], tag: 'cerdo', nombre: 'Bondiola sellada y glaseada', corto: 'El cerdo', pasos: ['Cortá bifes de 2 cm y salpimentá.', 'Sellá en sartén caliente 3 minutos por lado hasta dorar.', 'Bajá el fuego y terminá 4 a 5 minutos: el centro apenas rosado, jugoso.', 'Glaseá en la misma sartén con la salsa y reposá 3 minutos.'] },
    { id: 'pescado-noisette', req: ['pescado', 'manteca'], tag: 'pescado', nombre: 'Pescado a la manteca noisette', corto: 'El pescado', pasos: ['Secá muy bien los filetes y pasalos apenas por harina si tenés.', 'Sartén con aceite, el filete del lado de la piel (o el más lindo) 3 minutos.', 'Vuelta, sumá una cucharada de manteca y bañalo con la cuchara mientras espuma.', 'Cuando la manteca huele a avellana, listo: unas gotas de limón al final.'] },
    { id: 'pescado-papillote', req: ['pescado', 'limon'], tag: 'pescado', nombre: 'Pescado en papillote', corto: 'El papillote', pasos: ['Sobre papel manteca: verduras en juliana fina, el filete encima.', 'Sal, pimienta, rodajas de limón, hierbas y un hilo de aceite.', 'Cerrá el paquete bien plegado para que no se escape el vapor.', 'Horno a 200 °C, 12 a 15 minutos. Se abre en la mesa.'] },
    { id: 'salmon', req: ['salmon'], tag: 'salmon', nombre: 'Salmón con piel crocante', corto: 'El salmón', pasos: ['Secá la piel con papel y hacele dos cortes superficiales.', 'Sartén con aceite, piel abajo, presionando 10 segundos para que no se curve.', '4 a 5 minutos sin moverlo, hasta que la piel cruja; vuelta y 1 minuto más.', 'Servilo con el centro apenas rosado: queda húmedo y sedoso.'] },
    { id: 'langostinos', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['langostinos', 'ajo'], tag: 'langostinos', nombre: 'Langostinos al ajillo', corto: 'Los langostinos', pasos: ['Pelalos dejando la cola y sacales la tripa.', 'Aceite con ajo laminado a fuego bajo hasta que el ajo apenas dore.', 'Subí el fuego y sumá los langostinos: 1 minuto y medio por lado.', 'Fuera del fuego, perejil y unas gotas de limón. Pan para mojar.'] },
    { id: 'tortilla', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['huevos', 'papa'], tag: 'huevos', nombre: 'Tortilla de papas jugosa', corto: 'La tortilla', pasos: ['Papas en láminas finas confitadas en abundante aceite a fuego bajo, 20 minutos (con cebolla, si tenés).', 'Escurrí y mezclá con los huevos batidos y sal. Que repose 5 minutos.', 'Sartén caliente con poco aceite, volcá y mové los bordes los primeros segundos.', 'Vuelta con un plato y 1 minuto más: el centro tiene que quedar jugoso.'] },
    { id: 'shakshuka', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['huevos', 'cebolla'], alt: ['tomate_lata', 'tomate'], tag: 'huevos', nombre: 'Huevos en salsa de tomate especiada', corto: 'Los huevos', pasos: ['Rehogá cebolla (y morrón, si tenés) en aceite hasta que estén tiernos.', 'Sumá el tomate, sal, pimentón o comino y cociná 10 minutos.', 'Hacé huecos en la salsa y cascá un huevo en cada uno.', 'Tapá a fuego bajo 5 a 6 minutos: claras cuajadas, yemas líquidas.'] },
    { id: 'frittata', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['huevos'], tag: 'huevos', nombre: 'Frittata de verduras', corto: 'La frittata', pasos: ['Salteá las verduras que tengas en una sartén apta horno.', 'Batí los huevos con sal, pimienta y queso rallado si hay.', 'Volcá sobre las verduras y cociná a fuego bajo hasta que los bordes cuajen.', 'Terminá 5 minutos en horno o gratinador hasta que se infle y dore.'] },
    { id: 'croquetas-atun', req: ['atun', 'papa'], tag: 'pescado', nombre: 'Croquetas de atún y papa', corto: 'Las croquetas', pasos: ['Hacé un puré seco de papa y mezclalo con el atún bien escurrido.', 'Sumá verdeo o perejil picado, sal, pimienta y un huevo si tenés.', 'Formá croquetas, pasalas por pan rallado o harina y enfrialas 15 minutos.', 'Doralas en sartén con aceite o al horno a 200 °C dándolas vuelta.'] },
    { id: 'curry-garbanzos', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['legumbres'], alt: ['tomate_lata', 'tomate', 'crema', 'leche'], tag: 'legumbres', nombre: 'Curry de garbanzos o lentejas', corto: 'El curry', pasos: ['Rehogá cebolla y ajo con curry o pimentón y comino hasta que perfume.', 'Sumá las legumbres cocidas y el tomate (o la crema).', 'Cociná 15 minutos a fuego bajo hasta que espese.', 'Terminá con limón y hierbas frescas para darle vida.'] },
    { id: 'risotto', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['arroz', 'manteca'], alt: ['caldo', 'cebolla'], tag: 'arroz', nombre: 'Risotto cremoso', corto: 'El risotto', pasos: ['Rehogá cebolla en manteca, sumá el arroz y nacaralo 2 minutos.', 'Desglasá con vino (si hay) y agregá caldo caliente de a un cucharón, revolviendo.', 'A los 16-18 minutos el grano está al dente.', 'Fuera del fuego, manteca fría y queso: la mantecatura le da la cremosidad.'] },
    { id: 'pasta', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['fideos'], tag: 'pasta', nombre: 'Fideos de chef', corto: 'La pasta', pasos: ['Agua abundante con sal (10 g por litro) en hervor fuerte.', 'Cociná 1 minuto menos de lo que dice el paquete.', 'Guardá una taza del agua de cocción antes de colar.', 'Terminá los fideos 1 minuto dentro de la salsa con un chorrito de esa agua: liga y brilla.'] },
    { id: 'parmesana', guar: ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados'], req: ['berenjena', 'queso'], alt: ['tomate_lata', 'tomate'], tag: 'vegetal', nombre: 'Berenjenas a la parmesana', corto: 'Las berenjenas', pasos: ['Cortá rodajas de 1 cm, salalas y dejalas 15 minutos; secalas.', 'Doralas a la plancha o al horno con un hilo de aceite.', 'Armá capas en una fuente: salsa de tomate, berenjena, queso.', 'Horno a 200 °C, 20 minutos hasta que gratine.'] }
  ];
  const SALSAS = [
    { id: 'mostaza-miel', req: ['mostaza', 'miel'], va: ['pollo', 'cerdo', 'salmon'], nombre: 'Glaseado de mostaza y miel', pasos: ['Mezclá 2 cucharadas de mostaza con 1 de miel y un chorrito de agua.', 'Volcalo en la sartén caliente donde cocinaste, raspando el fondo.', 'Reducí 1 minuto hasta que brille y bañá la proteína.'] },
    { id: 'crema-hongos', req: ['crema', 'hongos'], va: ['pollo', 'carne', 'cerdo', 'pasta', 'arroz'], nombre: 'Salsa de crema y hongos', pasos: ['Salteá los hongos a fuego fuerte sin moverlos, hasta dorar.', 'Sumá ajo, sal y pimienta, y después la crema.', 'Reducí 3 a 4 minutos a fuego bajo hasta que nape la cuchara.'] },
    { id: 'vino', req: ['vino', 'manteca'], va: ['carne', 'cerdo', 'pollo'], nombre: 'Reducción al vino', pasos: ['En la misma sartén de la carne, sumá cebolla o ajo picado 1 minuto.', 'Desglasá con medio vaso de vino y reducí a la mitad.', 'Fuera del fuego, una cucharada de manteca fría: liga y da brillo.'] },
    { id: 'chimichurri', req: ['ajo', 'hierbas'], va: ['carne', 'cerdo', 'pollo', 'picada'], nombre: 'Chimichurri de hierbas frescas', pasos: ['Picá a cuchillo perejil y orégano frescos con ajo.', 'Sumá ají molido, sal, un chorrito de vinagre o limón y aceite.', 'Dejalo reposar 15 minutos: los sabores se integran.'] },
    { id: 'criolla', req: ['cebolla', 'tomate', 'morron'], va: ['carne', 'cerdo', 'pollo', 'pescado', 'picada'], nombre: 'Salsa criolla', pasos: ['Cebolla, tomate sin semillas y morrón en cubos chiquitos y parejos.', 'Sal, aceite y un chorrito de vinagre o limón.', 'Mejor si descansa 20 minutos antes de servir.'] },
    { id: 'beurre-limon', req: ['manteca', 'limon'], va: ['pescado', 'salmon', 'langostinos', 'pollo', 'pasta'], nombre: 'Manteca de limón', pasos: ['Reducí el jugo de medio limón en una ollita hasta la mitad.', 'Fuego mínimo y sumá manteca fría en cubos, batiendo, de a poco.', 'Sal y ralladura: tiene que quedar sedosa, sin hervir.'] },
    { id: 'yogur', req: ['yogur', 'limon'], va: ['pollo', 'salmon', 'legumbres', 'cerdo', 'pescado', 'huevos'], nombre: 'Salsa de yogur y limón', pasos: ['Yogur natural con ralladura y unas gotas de limón.', 'Sal, pimienta, un hilo de oliva y hierbas o ajo rallado si hay.', 'Fría, bien a último momento.'] },
    { id: 'teriyaki', req: ['soja', 'miel'], va: ['salmon', 'pollo', 'cerdo', 'langostinos'], nombre: 'Teriyaki casera', pasos: ['3 cucharadas de soja, 1 de miel, ajo rallado y un chorrito de agua.', 'Hervila 2 minutos hasta que espese y brille.', 'Pintá la proteína al final de la cocción, en la sartén.'] },
    { id: 'pomodoro', req: [], alt: ['tomate_lata', 'tomate'], va: ['pasta', 'picada', 'huevos', 'vegetal', 'pescado'], nombre: 'Pomodoro rápido', pasos: ['Ajo en aceite a fuego bajo hasta que perfume, sin dorar.', 'Sumá el tomate, sal y una pizca de azúcar si está ácido.', 'Cociná 15 minutos y terminá con albahaca u orégano.'] },
    { id: 'crema-queso', req: ['crema', 'queso'], va: ['pasta', 'pollo', 'arroz'], nombre: 'Salsa de crema y queso', pasos: ['Calentá la crema sin que hierva fuerte.', 'Sumá el queso rallado fuera del fuego, revolviendo hasta fundir.', 'Pimienta recién molida y nuez moscada.'] },
    { id: 'gremolata', req: ['hierbas', 'limon', 'ajo'], va: ['pescado', 'salmon', 'carne', 'cerdo', 'pollo', 'langostinos'], nombre: 'Gremolata', pasos: ['Picá muy fino perejil y ajo.', 'Sumá ralladura de limón (solo la parte amarilla).', 'Espolvoreala sobre el plato recién salido del fuego.'] },
    { id: 'pesto', req: ['hierbas', 'queso', 'ajo'], va: ['pasta', 'pollo', 'huevos', 'vegetal'], nombre: 'Pesto casero', pasos: ['Albahaca, ajo, queso y frutos secos si tenés.', 'Procesá o picá a cuchillo sumando aceite en hilo.', 'Nunca al fuego: se suma a la pasta caliente fuera de la hornalla.'] },
    { id: 'manteca-salvia', req: ['manteca', 'hierbas'], va: ['pasta', 'pescado', 'pollo', 'arroz'], nombre: 'Manteca de hierbas', pasos: ['Manteca a fuego medio hasta que espume.', 'Sumá las hierbas: chisporrotean y se vuelven crocantes.', 'Sal en escamas y al plato enseguida.'] },
    { id: 'salsa-verdeo', req: ['verdeo', 'crema'], va: ['pollo', 'cerdo', 'pescado', 'pasta'], nombre: 'Crema de verdeo', pasos: ['Rehogá el verdeo en rodajas finas con un poco de manteca o aceite.', 'Sumá la crema, sal y pimienta.', 'Reducí 3 minutos hasta que espese.'] }
  ];
  const GUARN = [
    { id: 'papas-rusticas', req: ['papa'], nombre: 'Papas rústicas al romero', pasos: ['Papas con cáscara en gajos, hervidas 5 minutos y bien secas.', 'Aceite, sal, ajo machacado y romero (o hierbas que tengas).', 'Horno fuerte, 220 °C, 30 minutos dándolas vuelta una vez.'] },
    { id: 'pure', req: ['papa', 'manteca'], nombre: 'Puré de papas a la manteca', pasos: ['Papas en cubos parejos desde agua fría con sal, hasta que estén tiernas.', 'Escurrí, secá 1 minuto en la olla y pisá en caliente.', 'Manteca fría y leche o crema caliente, de a poco. Nuez moscada.'] },
    { id: 'pure-batata', req: ['batata'], nombre: 'Puré de batata', pasos: ['Batata asada entera en el horno hasta que esté bien blanda (concentra el dulzor).', 'Pisala con manteca o aceite de oliva.', 'Sal, pimienta y una pizca de ralladura de limón o canela.'] },
    { id: 'pure-zapallo', req: ['zapallo'], nombre: 'Puré de zapallo asado', pasos: ['Zapallo en cubos al horno con aceite y sal hasta caramelizar.', 'Pisalo con manteca o un chorrito de crema.', 'Terminá con queso rallado o nuez moscada.'] },
    { id: 'asados', min2: ['zucchini', 'berenjena', 'morron', 'zanahoria', 'cebolla', 'zapallo', 'batata', 'brocoli'], nombre: 'Vegetales asados', pasos: ['Cortá todo en piezas del mismo tamaño para que se cocinen parejo.', 'Aceite, sal y una sola capa en la placa: si se amontonan, hierven.', 'Horno a 220 °C, 25 minutos, hasta que tengan bordes dorados.'] },
    { id: 'espinaca-crema', req: ['espinaca', 'crema'], nombre: 'Espinaca a la crema', pasos: ['Blanqueá la espinaca 30 segundos y escurrila bien apretada.', 'Picala y sumala a la crema reducida con ajo.', 'Nuez moscada, sal y queso rallado si hay.'] },
    { id: 'arroz-pilaf', req: ['arroz', 'cebolla'], nombre: 'Arroz pilaf', pasos: ['Rehogá cebolla picada y nacará el arroz 2 minutos en la misma olla.', 'Agua o caldo caliente: el doble de volumen que el arroz.', 'Tapá a fuego mínimo 15 minutos y reposá 5 sin destapar.'] },
    { id: 'ensalada-palta', req: ['tomate', 'palta'], nombre: 'Ensalada de tomate y palta', pasos: ['Tomate en gajos y palta en cubos grandes.', 'Cebolla morada fina o verdeo si hay.', 'Limón, sal en escamas y aceite de oliva al momento.'] },
    { id: 'brocoli', req: ['brocoli', 'ajo'], nombre: 'Brócoli salteado al ajo', pasos: ['Blanqueá los ramitos 2 minutos y cortá la cocción en agua fría.', 'Salteá con aceite y ajo laminado hasta que tome color.', 'Limón y sal al final.'] },
    { id: 'choclo', req: ['choclo', 'crema'], nombre: 'Choclo cremoso', pasos: ['Rehogá cebolla y sumá los granos de choclo.', 'Agregá crema y cociná 5 minutos.', 'Procesá la mitad para que quede cremoso con textura.'] },
    { id: 'hongos', req: ['hongos'], nombre: 'Hongos salteados', pasos: ['Sartén muy caliente y los hongos en una sola capa.', 'No los muevas hasta que doren; recién ahí la sal.', 'Ajo, perejil y una nuez de manteca al final.'] },
    { id: 'zanahorias', req: ['zanahoria', 'miel'], nombre: 'Zanahorias glaseadas', pasos: ['Zanahorias en bastones con agua, manteca, miel y sal.', 'Cociná destapado hasta que el líquido se evapore.', 'Mové la sartén para que brillen glaseadas.'] },
    { id: 'pan-ajo', req: ['pan', 'ajo'], nombre: 'Pan tostado al ajo', pasos: ['Rodajas de pan con aceite o manteca.', 'Tostalo en sartén o horno hasta que cruja.', 'Frotá un diente de ajo crudo por encima.'] },
    { id: 'fideos-manteca', req: ['fideos', 'manteca', 'queso'], nombre: 'Fideos a la manteca y queso', pasos: ['Fideos al dente, guardando un poco de agua de cocción.', 'Manteca y queso con un chorrito de esa agua.', 'Revolvé fuera del fuego hasta que quede cremoso.'] },
    { id: 'ensalada-verde', req: ['limon'], nombre: 'Ensalada fresca con vinagreta de limón', pasos: ['Hojas verdes o lo que tengas crudo, bien seco.', 'Vinagreta: 1 parte de limón, 3 de aceite, sal y mostaza si hay.', 'Aliñá recién al servir para que no se marchite.'] }
  ];
  const TOQUES = {
    pollo: 'Antes de servir, unas gotas de limón y sal en escamas: levantan todo el plato.',
    carne: 'Cortá la carne en contra de la fibra y servila en láminas: se ve de restaurante y es más tierna.',
    picada: 'Sal recién al cocinar: si salás la carne picada antes, se pone dura.',
    cerdo: 'El cerdo de hoy se come apenas rosado: más jugoso y seguro.',
    pescado: 'Calentá los platos: el pescado se enfría muy rápido.',
    salmon: 'Sal en escamas sobre la piel recién salida: cruje todavía más.',
    langostinos: 'Pan tostado al lado: el aceite del ajillo es la mitad del plato.',
    huevos: 'Sacalos del fuego un poquito antes: el calor residual termina la cocción.',
    legumbres: 'Un chorrito de limón al final: despierta los sabores de las legumbres.',
    arroz: 'El risotto se espera, no espera: servilo apenas sale.',
    pasta: 'Nunca enjuagues la pasta: el almidón es lo que hace que la salsa se pegue.',
    vegetal: 'Un hilo de oliva crudo al final y hojas frescas: color y aroma.'
  };
  const EMPLATADO = 'Platos calientes, la proteína al centro, la guarnición al costado y la salsa por debajo o en un bowl aparte. Algo verde fresco arriba y listo.';

  const BASICOS = new Set(['sal', 'pimienta', 'aceite']);
  const tiene = (sel, k) => sel.has(k) || BASICOS.has(k);
  const cumple = (x, sel) => {
    if (x.req && !x.req.every(k => tiene(sel, k))) return false;
    if (x.alt && x.alt.length && !x.alt.some(k => sel.has(k))) return false;
    if (x.min2 && x.min2.filter(k => sel.has(k)).length < 2) return false;
    return true;
  };
  const usados = (x, sel) => [...new Set([...(x.req || []), ...(x.alt || []).filter(k => sel.has(k)), ...(x.min2 || []).filter(k => sel.has(k))])].filter(k => sel.has(k));

  function combinar(sel) {
    const ps = PRINC.filter(p => cumple(p, sel));
    const out = [];
    ps.forEach(p => {
      const ss = SALSAS.filter(s => s.va.includes(p.tag) && cumple(s, sel));
      const gs = GUARN.filter(g => cumple(g, sel) && (!p.guar || p.guar.includes(g.id)) && !(g.req || []).some(k => (p.req || []).includes(k) && k !== 'ajo' && k !== 'manteca'));
      const opS = ss.length ? ss : [null], opG = gs.length ? gs : [null];
      opS.forEach(s => opG.forEach(g => {
        const u = new Set([...usados(p, sel), ...(s ? usados(s, sel) : []), ...(g ? usados(g, sel) : [])]);
        out.push({ p, s, g, usa: [...u], score: u.size * 10 + (s ? 6 : 0) + (g ? 6 : 0) + (p.req.length > 1 ? 3 : 0) });
      }));
    });
    out.sort((a, b) => b.score - a.score);
    // variedad: no repetir principal en las primeras opciones
    const top = [], uso = {};
    const pen = o => (uso['p' + o.p.id] || 0) * 14 + (o.s ? (uso['s' + o.s.id] || 0) * 9 : 0) + (o.g ? (uso['g' + o.g.id] || 0) * 9 : 0);
    while (top.length < 4 && out.length) {
      let bi = 0, bv = -1e9; out.forEach((o, k) => { const v = o.score - pen(o); if (v > bv) { bv = v; bi = k; } });
      const o = out.splice(bi, 1)[0]; top.push(o); uso['p' + o.p.id] = (uso['p' + o.p.id] || 0) + 1; if (o.s) uso['s' + o.s.id] = (uso['s' + o.s.id] || 0) + 1; if (o.g) uso['g' + o.g.id] = (uso['g' + o.g.id] || 0) + 1;
    }
    return top;
  }
  const nombrePlato = o => o.p.nombre + (o.s ? ', ' + o.s.nombre.charAt(0).toLowerCase() + o.s.nombre.slice(1) : '') + (o.g ? ' y ' + o.g.nombre.charAt(0).toLowerCase() + o.g.nombre.slice(1) : '');

  /* ───────── estado y panel ───────── */
  const QCH = window.QCH = { sel: new Set(), opciones: [], n: 1 };
  try { const g = JSON.parse(localStorage.getItem('cel_qch') || '{}'); (g.sel || []).forEach(k => INFO[k] && QCH.sel.add(k)); QCH.n = g.n || 1; } catch (e) {}
  const guardar = () => { try { localStorage.setItem('cel_qch', JSON.stringify({ sel: [...QCH.sel], n: QCH.n })); } catch (e) {} };
  const escQ = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  window.panelQCH = function () {
    const sel = QCH.sel;
    QCH.opciones = sel.size ? combinar(sel) : [];
    return `<p class="hint"><b style="color:var(--cream)">🧊 ¿Qué comemos hoy?</b><br>Marcá lo que hay en la heladera y te armo el plato estilo chef: principal, salsa, guarnición y toque de chef. Cada plato se convierte en una saga de 6 historias. Sal, pimienta y aceite se dan por sentados.</p>
      <div class="qch-top"><span>${sel.size ? sel.size + ' elegidos' : 'Nada elegido'}</span><button class="btn sec sm" onclick="qchAzar()">🎲 Heladera al azar</button>${sel.size ? '<button class="btn sec sm" onclick="qchLimpiar()">Vaciar</button>' : ''}</div>
      ${ING.map(([g, l]) => `<div class="qch-g">${g}</div><div class="qch-chips">${l.map(([k, e, n]) => `<button class="qch-c${sel.has(k) ? ' on' : ''}" onclick="qchToggle('${k}')">${e} ${escQ(n)}</button>`).join('')}</div>`).join('')}
      <div class="qch-g" style="margin-top:16px">Platos posibles</div>
      ${!sel.size ? '<p class="hint">Elegí al menos una proteína, huevos, arroz o fideos.</p>' : !QCH.opciones.length ? '<p class="hint">Con esto no me sale un plato completo: sumá una proteína, huevos, arroz o fideos.</p>' :
        `<div class="items">${QCH.opciones.map((o, i) => `<button class="it" onclick="qchSaga(${i})"><span class="ic">${INFO[o.p.req[0]].e}</span><div><b>${escQ(o.p.nombre)}</b><span>${escQ([o.s && 'Salsa: ' + o.s.nombre, o.g && 'Guarnición: ' + o.g.nombre].filter(Boolean).join(' · ') || 'Sin salsa ni guarnición con lo elegido')}</span></div></button>`).join('')}</div>
        <p class="hint" style="margin-top:8px">Tocá un plato para sumar la saga a la mesa. Después podés editar cada placa y sumarle tu foto.</p>`}
      <div class="qch-g" style="margin-top:14px">Con IA</div>
      <button class="btn sec sm" id="qch-ia" onclick="qchIA()" style="width:100%" ${sel.size ? '' : 'disabled'}>✨ Que la IA invente un plato con lo elegido</button>`;
  };
  window.qchToggle = k => { QCH.sel.has(k) ? QCH.sel.delete(k) : QCH.sel.add(k); guardar(); renderPanel(); };
  window.qchLimpiar = () => { QCH.sel.clear(); guardar(); renderPanel(); };
  window.qchAzar = () => {
    QCH.sel.clear(); const pick = (arr, n) => arr.slice().sort(() => Math.random() - .5).slice(0, n);
    const prot = ING[0][1].map(x => x[0]), veg = ING[1][1].map(x => x[0]), lac = ING[2][1].map(x => x[0]), des = ING[3][1].map(x => x[0]);
    [...pick(prot, 1), ...pick(veg, 5), ...pick(lac, 2), ...pick(des, 3)].forEach(k => QCH.sel.add(k)); guardar(); renderPanel();
  };

  /* ───────── la saga: 6 placas ───────── */
  const LINK = 'https://chefprivado.ar/?utm_source=instagram&utm_medium=historia&utm_campaign=que-comemos-hoy';
  function saga(plato) {
    const n = QCH.n++; guardar();
    const etq = '¿Qué comemos hoy? · #' + n;
    const ingred = plato.ingredientes.map(k => INFO[k] ? INFO[k].e + ' ' + INFO[k].n : k);
    const out = [
      { tpl: 'qch_portada', kicker: etq, titulo: '¿Qué comemos hoy?', texto: ingred.join('\n'), link: LINK },
      { tpl: 'qch_lista', kicker: 'Con lo que hay', titulo: plato.nombre, texto: ingred.join('\n'), link: LINK },
      { tpl: 'qch_paso', kicker: 'Paso 1 · ' + plato.principal.corto, titulo: plato.principal.nombre, texto: plato.principal.pasos.join('\n'), link: LINK, img: null }
    ];
    if (plato.salsa) out.push({ tpl: 'qch_paso', kicker: 'Paso 2 · La salsa', titulo: plato.salsa.nombre, texto: plato.salsa.pasos.join('\n'), link: LINK });
    if (plato.guarnicion) out.push({ tpl: 'qch_paso', kicker: 'Paso ' + (plato.salsa ? 3 : 2) + ' · La guarnición', titulo: plato.guarnicion.nombre, texto: plato.guarnicion.pasos.join('\n'), link: LINK });
    out.push({ tpl: 'qch_cierre', kicker: 'El toque de chef', titulo: plato.nombre, texto: plato.toque + '\n' + EMPLATADO, link: LINK });
    return out;
  }
  window.qchSaga = function (i) {
    const o = QCH.opciones[i]; if (!o) return;
    const plato = { nombre: nombrePlato(o), principal: o.p, salsa: o.s, guarnicion: o.g, toque: TOQUES[o.p.tag] || TOQUES.vegetal,
      ingredientes: [...QCH.sel].filter(k => o.usa.includes(k)) };
    if (!plato.ingredientes.length) plato.ingredientes = o.usa;
    sumarSaga(saga(plato));
  };
  function sumarSaga(placas) {
    const ini = historias.length;
    placas.forEach(h => historias.push(Object.assign({ foco: 50, zoom: 1 }, h)));
    renderGrid(); renderPanel(); toast('Saga sumada: ' + placas.length + ' historias');
    setTimeout(() => { const c = document.querySelectorAll('.card')[ini]; c && c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  }

  /* ───────── con IA ───────── */
  window.qchIA = async function () {
    const b = document.getElementById('qch-ia'); if (!QCH.sel.size) return; b.disabled = true; b.textContent = '✨ Cocinando la idea…';
    const lista = [...QCH.sel].map(k => INFO[k].n).join(', ');
    const pedido = `Sos Daro Castello, chef privado de Celestia en Buenos Aires (formado en escuela de cocina). Con estos ingredientes de una heladera común: ${lista}. Además hay sal, pimienta y aceite.
Armá UN plato casero pero con técnica y presentación de chef privado. Podés no usar todo. No agregues ingredientes que no estén, salvo especias secas comunes.
Respondé SOLO un JSON válido, sin texto extra, con esta forma:
{"nombre":"nombre del plato completo","usa":["ingredientes de la lista que usás"],"principal":{"nombre":"...","pasos":["3 o 4 pasos cortos, máx 110 caracteres cada uno"]},"salsa":{"nombre":"...","pasos":["3 pasos cortos"]},"guarnicion":{"nombre":"...","pasos":["3 pasos cortos"]},"toque":"un consejo de chef de una oración","emplatado":"cómo servirlo, una oración"}
Español rioplatense con voseo, pasos en imperativo (salteá, sumá, cociná), temperaturas y tiempos concretos.`;
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: pedido }] }) });
      const d = await r.json(); const t = d && d.content && d.content.map(c => c.text || '').join('').trim();
      if (!t) throw new Error((d && d.error && (d.error.message || d.error)) || 'sin respuesta');
      const j = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
      const porNombre = Object.fromEntries(Object.entries(INFO).map(([k, v]) => [v.n.toLowerCase(), k]));
      const ingr = (j.usa || []).map(s => porNombre[String(s).toLowerCase()] || [...QCH.sel].find(k => String(s).toLowerCase().includes(INFO[k].n.toLowerCase().split(' ')[0]))).filter(Boolean);
      const mk = (x, corto) => x && x.nombre ? { nombre: x.nombre, corto, pasos: (x.pasos || []).slice(0, 4) } : null;
      sumarSaga(saga({ nombre: j.nombre || 'El plato de hoy', principal: mk(j.principal, 'El principal') || { nombre: j.nombre, corto: 'El plato', pasos: [] }, salsa: mk(j.salsa), guarnicion: mk(j.guarnicion),
        toque: j.toque || '', ingredientes: [...new Set(ingr.length ? ingr : [...QCH.sel])] }).map(h => h.tpl === 'qch_cierre' && j.emplatado ? Object.assign(h, { texto: (j.toque || '') + '\n' + j.emplatado }) : h));
    } catch (e) { toast('No se pudo usar la IA: ' + String(e.message || e).slice(0, 80)); }
    b.disabled = false; b.textContent = '✨ Que la IA invente un plato con lo elegido';
  };

  /* ───────── plantillas de canvas ───────── */
  Object.assign(PLANTILLAS, { qch_portada: '¿Qué comemos hoy? · Portada', qch_lista: '¿Qué comemos hoy? · Heladera', qch_paso: '¿Qué comemos hoy? · Paso', qch_cierre: '¿Qué comemos hoy? · Toque de chef' });
  const ls = (x, on) => { if ('letterSpacing' in x) x.letterSpacing = on; };
  function marca(x, oscuro) { x.font = '500 30px "DM Sans"'; x.textAlign = 'center'; x.fillStyle = oscuro ? 'rgba(250,246,239,.6)' : 'rgba(13,27,42,.6)'; ls(x, '4px'); x.fillText('CHEFPRIVADO.AR', W / 2, 1700); ls(x, '0px'); }
  function chips(x, items, y0, { bg, fg, borde, size = 38 }) {
    x.font = `500 ${size}px "DM Sans"`; const padX = 30, hh = size + 40, gap = 18, maxW = W - 160; let fila = [], filas = [], ancho = 0;
    items.forEach(t => { const w = x.measureText(t).width + padX * 2; if (ancho + w + (fila.length ? gap : 0) > maxW && fila.length) { filas.push(fila); fila = []; ancho = 0; } fila.push([t, w]); ancho += w + (fila.length > 1 ? gap : 0); });
    if (fila.length) filas.push(fila);
    let y = y0;
    filas.forEach(f => { const tot = f.reduce((a, [, w]) => a + w, 0) + gap * (f.length - 1); let px = (W - tot) / 2;
      f.forEach(([t, w]) => { x.fillStyle = bg; x.beginPath(); x.roundRect(px, y, w, hh, hh / 2); x.fill(); if (borde) { x.strokeStyle = borde; x.lineWidth = 2.5; x.stroke(); } x.fillStyle = fg; x.textAlign = 'center'; x.fillText(t, px + w / 2, y + hh / 2 + size * .35); px += w + gap; });
      y += hh + gap; });
    return y;
  }
  Object.assign(TPL, {
    qch_portada(x, h, img, logo) {
      fondoNavy(x, 57);
      if (img) { x.globalAlpha = .28; cover(x, img, 0, 0, W, H, h.foco, h.zoom); x.globalAlpha = 1; }
      logoTop(x, logo, 200);
      let y = 470;
      y = bloque(x, h.kicker, { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      x.font = '400 150px "DM Serif Display"'; x.textAlign = 'center'; x.fillStyle = C.cream;
      const t = String(h.titulo || '¿Qué comemos hoy?'), m = t.match(/^(.*?)(\S+\s*\?)$/);
      x.fillText(m ? m[1].trim() : t, W / 2, y + 190);
      if (m) { x.font = 'italic 400 170px "DM Serif Display"'; x.fillStyle = C.gold2; x.fillText(m[2], W / 2, y + 360); }
      y += 440;
      x.font = '400 40px "DM Sans"'; x.fillStyle = 'rgba(250,246,239,.78)'; x.fillText('Abrí la heladera. Con esto armo un plato de chef:', W / 2, y);
      const items = String(h.texto || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12);
      chips(x, items, y + 50, { bg: 'rgba(250,246,239,.08)', fg: C.cream, borde: 'rgba(201,168,76,.55)', size: items.length > 8 ? 34 : 40 });
      pastilla(x, 'Deslizá y cocinamos →', 1540);
      marca(x, true);
    },
    qch_lista(x, h, img, logo, iso_) {
      x.fillStyle = C.cream; x.fillRect(0, 0, W, H);
      x.fillStyle = C.navy; x.fillRect(0, 0, W, 470); x.save(); x.beginPath(); x.rect(0, 0, W, 470); x.clip(); if (img) { cover(x, img, 0, 0, W, 470, h.foco, h.zoom); x.fillStyle = 'rgba(13,27,42,.35)'; x.fillRect(0, 0, W, 470); } else estrellas(x, 0, 0, 0, 60, 13); x.restore();
      logoTop(x, logo, 150);
      let y = 520;
      y = bloque(x, '🧊 ' + (h.kicker || 'Con lo que hay'), { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: '#a08a5c', align: 'center', upper: true, spacing: 6 });
      const items = String(h.texto || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10);
      const col2 = items.length > 5, cw = col2 ? (W - 200) / 2 : W - 200;
      x.font = '500 42px "DM Sans"';
      items.forEach((t, k) => { const c = col2 ? k % 2 : 0, r = col2 ? Math.floor(k / 2) : k; const px = 100 + c * cw, py = y + 80 + r * 84;
        x.fillStyle = C.gold; x.beginPath(); x.arc(px + 22, py - 14, 22, 0, 7); x.fill(); x.fillStyle = C.navy; x.font = '700 26px "DM Sans"'; x.textAlign = 'center'; x.fillText('✓', px + 22, py - 5);
        x.fillStyle = C.navy; x.font = '500 40px "DM Sans"'; x.textAlign = 'left'; x.fillText(lineas(x, t, cw - 70)[0] || '', px + 62, py); });
      y = y + 80 + Math.ceil(items.length / (col2 ? 2 : 1)) * 84;
      x.font = 'italic 400 34px "DM Serif Display"'; x.fillStyle = '#7a6a4a'; x.textAlign = 'center'; x.fillText('+ sal, pimienta y aceite', W / 2, y + 10);
      x.fillStyle = C.gold; x.fillRect(W / 2 - 50, y + 60, 100, 4);
      y = bloque(x, 'Hoy cocinamos', { font: '600 {s}px "DM Sans"', size: 30, maxW: W - 180, maxLines: 1, y: y + 100, color: '#a08a5c', align: 'center', upper: true, spacing: 5 });
      bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 74, min: 44, maxW: W - 180, maxLines: 4, y: y + 24, color: C.navy, align: 'center', lh: 1.12 });
      marca(x, false);
    },
    qch_paso(x, h, img, logo) {
      fondoNavy(x, 71);
      let y;
      if (img) {
        cover(x, img, 0, 0, W, 760, h.foco, h.zoom);
        const g = x.createLinearGradient(0, 480, 0, 780); g.addColorStop(0, 'rgba(13,27,42,0)'); g.addColorStop(1, C.navy); x.fillStyle = g; x.fillRect(0, 480, W, 300);
        const g2 = x.createLinearGradient(0, 0, 0, 330); g2.addColorStop(0, 'rgba(13,27,42,.6)'); g2.addColorStop(1, 'rgba(13,27,42,0)'); x.fillStyle = g2; x.fillRect(0, 0, W, 330);
        logoTop(x, logo, 150); y = 740;
      } else { logoTop(x, logo, 200); y = 440; }
      y = bloque(x, h.kicker, { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: img ? 76 : 90, min: 52, maxW: W - 180, maxLines: 2, y: y + 26, color: C.cream, align: 'center', lh: 1.1 });
      x.fillStyle = C.gold; x.fillRect(W / 2 - 50, y + 44, 100, 4);
      const pasos = String(h.texto || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 5);
      const disp = 1480 - (y + 90); let size = img ? 44 : 52, bloques;
      const medir = s => { x.font = `400 ${s}px "DM Sans"`; return pasos.map(p => lineas(x, p, W - 290)); };
      do { bloques = medir(size); const alto = bloques.reduce((a, l) => a + l.length * size * 1.32 + 42, 0); if (alto <= disp || size <= 28) break; size -= 2; } while (true);
      let py = y + 100;
      bloques.forEach((ls_, k) => {
        x.fillStyle = C.gold; x.beginPath(); x.arc(125, py + size * .5, 30, 0, 7); x.fill();
        x.fillStyle = C.navy; x.font = '700 30px "DM Sans"'; x.textAlign = 'center'; x.fillText(String(k + 1), 125, py + size * .5 + 11);
        x.fillStyle = 'rgba(250,246,239,.92)'; x.font = `400 ${size}px "DM Sans"`; x.textAlign = 'left';
        ls_.forEach((l, j) => x.fillText(l, 180, py + size * .85 + j * size * 1.32));
        py += ls_.length * size * 1.32 + 42;
      });
      marca(x, true);
    },
    qch_cierre(x, h, img, logo) {
      fondoNavy(x, 89);
      if (img) { x.globalAlpha = .3; cover(x, img, 0, 0, W, H, h.foco, h.zoom); x.globalAlpha = 1; x.fillStyle = 'rgba(13,27,42,.35)'; x.fillRect(0, 0, W, H); }
      logoTop(x, logo, 200);
      let y = 470;
      y = bloque(x, '✦ ' + (h.kicker || 'El toque de chef'), { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 70, min: 44, maxW: W - 180, maxLines: 4, y: y + 30, color: C.cream, align: 'center', lh: 1.12 });
      const [toque, ...resto] = String(h.texto || '').split('\n');
      x.fillStyle = C.gold; x.font = '400 170px "DM Serif Display"'; x.textAlign = 'center'; x.fillText('“', W / 2, y + 170);
      y = bloque(x, toque, { font: 'italic 400 {s}px "DM Serif Display"', size: 54, min: 36, maxW: W - 200, maxLines: 4, y: y + 150, color: C.gold2, align: 'center', lh: 1.25 });
      bloque(x, resto.join(' '), { font: '400 {s}px "DM Sans"', size: 36, min: 28, maxW: W - 220, maxLines: 4, y: y + 40, color: 'rgba(250,246,239,.78)', align: 'center', lh: 1.4 });
      pastilla(x, '¿Te lo cocino yo? Escribime', 1530);
      marca(x, true);
    }
  });
})();
