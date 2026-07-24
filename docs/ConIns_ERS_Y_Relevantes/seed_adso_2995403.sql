-- ============================================================
-- SEED DATA — PROGRAMA ADSO 228118 · FICHA 2995403
-- Fuente: Reporte de Juicios Evaluativos — Sofía Plus
-- Centro: 9201 — Centro del Diseño y Manufactura del Cuero
-- Regional: 5 — Antioquia
-- Fecha de extracción: 13/04/2026
-- ============================================================
-- Tablas que alimenta este script:
--   programas, fichas, competencias, raps,
--   aprendices (referencia), competencia_rap
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 1. PROGRAMA
-- ============================================================
INSERT INTO programas (id, codigo, nombre, nivel, tipo_formacion, activo) VALUES
(1, '228118', 'Análisis y Desarrollo de Software', 'tecnologo', 'tecnica', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- 2. FICHA
-- ============================================================
INSERT INTO fichas (id, numero_ficha, programa_id, etapa, fecha_inicio_lectiva, fecha_fin_ficha, estado, activo) VALUES
(1, '2995403', 1, 'productiva', '2024-07-08', '2026-10-07', 'En ejecución', TRUE)
ON DUPLICATE KEY UPDATE estado = VALUES(estado);

-- ============================================================
-- 3. COMPETENCIAS
-- Formato: (id, codigo, nombre, tipo, activo)
-- tipo: 'tecnica' | 'transversal' | 'etapa_productiva'
-- ============================================================
INSERT INTO competencias (id, codigo, nombre, programa_id, tipo, activo) VALUES

-- Etapa productiva
(1,  '2',     'Resultados de aprendizaje etapa práctica',                                                                                                                    1, 'etapa_productiva', TRUE),

-- Transversales
(2,  '36180', 'Enrique Low Murtra — Interactuar en el contexto productivo y social de acuerdo con principios éticos para la construcción de una cultura de paz',             1, 'transversal', TRUE),
(3,  '36182', 'Resultado de aprendizaje de la inducción',                                                                                                                    1, 'transversal', TRUE),
(4,  '37371', 'Utilizar herramientas informáticas de acuerdo con las necesidades de manejo de información',                                                                  1, 'transversal', TRUE),
(5,  '37714', 'Interactuar en lengua inglesa de forma oral y escrita dentro de contextos sociales y laborales según los criterios del Marco Común Europeo de Referencia',    1, 'transversal', TRUE),
(6,  '37799', 'Aplicar prácticas de protección ambiental, seguridad y salud en el trabajo de acuerdo con las políticas organizacionales y la normatividad vigente',          1, 'transversal', TRUE),
(7,  '37800', 'Generar hábitos saludables de vida mediante la aplicación de programas de actividad física en los contextos productivos y sociales',                          1, 'transversal', TRUE),
(8,  '37801', 'Aplicación de conocimientos de las ciencias naturales de acuerdo con situaciones del contexto productivo y social',                                           1, 'transversal', TRUE),
(9,  '37802', 'Desarrollar procesos de comunicación eficaces y efectivos, teniendo en cuenta situaciones de orden social, personal y productivo',                            1, 'transversal', TRUE),
(10, '38199', 'Orientar investigación formativa según referentes técnicos',                                                                                                  1, 'transversal', TRUE),
(11, '38558', 'Ejercer derechos fundamentales del trabajo en el marco de la constitución política y los convenios internacionales',                                          1, 'transversal', TRUE),
(12, '38560', 'Razonar cuantitativamente frente a situaciones susceptibles de ser abordadas de manera matemática en contextos laborales, sociales y personales',             1, 'transversal', TRUE),
(13, '38561', 'Gestionar procesos propios de la cultura emprendedora y empresarial de acuerdo con el perfil personal y los requerimientos de los contextos productivo y social', 1, 'transversal', TRUE),

-- Técnicas ADSO
(14, '38356', 'Implementar la solución de software de acuerdo con los requisitos de operación y modelos de referencia',                                                      1, 'tecnica', TRUE),
(15, '38362', 'Diseñar la solución de software de acuerdo con procedimientos y requisitos técnicos',                                                                         1, 'tecnica', TRUE),
(16, '38367', 'Estructurar propuesta técnica de servicio de tecnología de la información según requisitos técnicos y normativa',                                             1, 'tecnica', TRUE),
(17, '38368', 'Desarrollar la solución de software de acuerdo con el diseño y metodologías de desarrollo',                                                                  1, 'tecnica', TRUE),
(18, '38369', 'Controlar la calidad del servicio de software de acuerdo con los estándares técnicos',                                                                       1, 'tecnica', TRUE),
(19, '38376', 'Evaluar requisitos de la solución de software de acuerdo con metodologías de análisis y estándares',                                                         1, 'tecnica', TRUE),
(20, '38392', 'Establecer requisitos de la solución de software de acuerdo con estándares y procedimiento técnico',                                                         1, 'tecnica', TRUE)

ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- 4. RAPs
-- Formato: (id, codigo, nombre, competencia_id, orden, activo)
-- ============================================================
INSERT INTO raps (id, codigo, nombre, competencia_id, orden, activo) VALUES

-- Competencia 1: Etapa productiva
(1,  '590803', 'Aplicar en la resolución de problemas reales del sector productivo los conocimientos, habilidades y destrezas pertinentes a las competencias del programa de formación asumiendo estrategias y metodologías de autogestión', 1, 1, TRUE),

-- Competencia 2: Ética (36180)
(2,  '593149', 'Promover mi dignidad y la del otro a partir de los principios y valores éticos como aporte en la instauración de una cultura de paz',                                                                 2, 1, TRUE),
(3,  '593147', 'Establecer relaciones de crecimiento personal y comunitario a partir del bien común como aporte para el desarrollo social',                                                                           2, 2, TRUE),
(4,  '593148', 'Promover el uso racional de los recursos naturales a partir de criterios de sostenibilidad y sustentabilidad ética y normativa vigente',                                                             2, 3, TRUE),
(5,  '593150', 'Contribuir con el fortalecimiento de la cultura de paz a partir de la dignidad humana y las estrategias para la transformación de conflictos',                                                       2, 4, TRUE),

-- Competencia 3: Inducción (36182)
(6,  '593343', 'Identificar la dinámica organizacional del SENA y el rol de la formación profesional integral de acuerdo con su proyecto de vida y el desarrollo profesional',                                      3, 1, TRUE),

-- Competencia 4: Herramientas TIC (37371)
(7,  '593154', 'Alistar herramientas de tecnologías de la información y la comunicación (TIC), de acuerdo con las necesidades de procesamiento de información y comunicación',                                      4, 1, TRUE),
(8,  '593151', 'Aplicar funcionalidades de herramientas y servicios TIC, de acuerdo con manuales de uso, procedimientos establecidos y buenas prácticas',                                                          4, 2, TRUE),
(9,  '593153', 'Evaluar los resultados, de acuerdo con los requerimientos',                                                                                                                                         4, 3, TRUE),
(10, '593152', 'Optimizar los resultados, de acuerdo con la verificación',                                                                                                                                          4, 4, TRUE),

-- Competencia 5: Inglés (37714)
(11, '593117', 'Comprender información sobre situaciones cotidianas y laborales actuales y futuras a través de interacciones sociales de forma oral y escrita',                                                     5, 1, TRUE),
(12, '593115', 'Intercambiar opiniones sobre situaciones cotidianas y laborales actuales, pasadas y futuras en contextos sociales orales y escritos',                                                               5, 2, TRUE),
(13, '593118', 'Discutir sobre posibles soluciones a problemas dentro de un rango variado de contextos sociales y laborales',                                                                                       5, 3, TRUE),
(14, '593114', 'Implementar acciones de mejora relacionadas con el uso de expresiones, estructuras y desempeño según los resultados de aprendizaje formulados para el programa',                                    5, 4, TRUE),
(15, '593116', 'Presentar un proceso para la realización de una actividad en su quehacer laboral de acuerdo con los procedimientos establecidos desde su programa de formación',                                    5, 5, TRUE),
(16, '593113', 'Explicar las funciones de su ocupación laboral usando expresiones de acuerdo al nivel requerido por el programa de formación',                                                                      5, 6, TRUE),

-- Competencia 6: SST (37799)
(17, '593156', 'Analizar las estrategias para la prevención y control de los impactos ambientales y de los accidentes y enfermedades laborales (ATEL)',                                                            6, 1, TRUE),
(18, '593158', 'Implementar estrategias para el control de los impactos ambientales y de los accidentes y enfermedades de acuerdo con los planes y programas establecidos',                                        6, 2, TRUE),
(19, '593157', 'Realizar seguimiento y acompañamiento al desarrollo de los planes y programas ambientales y SST, según el área de desempeño',                                                                      6, 3, TRUE),
(20, '593155', 'Proponer acciones de mejora para el manejo ambiental y el control de la SST, de acuerdo con estrategias de trabajo colaborativo, cooperativo y coordinado',                                        6, 4, TRUE),

-- Competencia 7: Actividad física (37800)
(21, '593120', 'Desarrollar habilidades psicomotrices en el contexto productivo y social',                                                                                                                         7, 1, TRUE),
(22, '593119', 'Practicar hábitos saludables mediante la aplicación de fundamentos de nutrición e higiene',                                                                                                        7, 2, TRUE),
(23, '593121', 'Ejecutar actividades de acondicionamiento físico orientadas hacia el mejoramiento de la condición física en los contextos productivo y social',                                                     7, 3, TRUE),
(24, '593122', 'Implementar un plan de ergonomía y pausas activas según las características de la función productiva',                                                                                             7, 4, TRUE),

-- Competencia 8: Ciencias naturales (37801)
(25, '593162', 'Identificar los principios y leyes de la física en la solución de problemas de acuerdo al contexto productivo',                                                                                    8, 1, TRUE),
(26, '593159', 'Solucionar problemas asociados con el sector productivo con base en los principios y leyes de la física',                                                                                          8, 2, TRUE),
(27, '593161', 'Verificar las transformaciones físicas de la materia utilizando herramientas tecnológicas',                                                                                                        8, 3, TRUE),
(28, '593160', 'Proponer acciones de mejora en los procesos productivos de acuerdo con los principios y leyes de la física',                                                                                       8, 4, TRUE),

-- Competencia 9: Comunicación (37802)
(29, '593225', 'Analizar los componentes de la comunicación según sus características, intencionalidad y contexto',                                                                                                9, 1, TRUE),
(30, '593227', 'Argumentar en forma oral y escrita atendiendo las exigencias y particularidades de las diversas situaciones comunicativas mediante los distintos sistemas de representación',                       9, 2, TRUE),
(31, '593224', 'Relacionar los procesos comunicativos teniendo en cuenta criterios de lógica y racionalidad',                                                                                                      9, 3, TRUE),
(32, '593226', 'Establecer procesos de enriquecimiento lexical y acciones de mejoramiento en el desarrollo de procesos comunicativos según requerimientos del contexto',                                           9, 4, TRUE),

-- Competencia 10: Investigación formativa (38199)
(33, '593236', 'Analizar el contexto productivo según sus características y necesidades',                                                                                                                          10, 1, TRUE),
(34, '593238', 'Estructurar el proyecto de acuerdo a criterios de la investigación',                                                                                                                               10, 2, TRUE),
(35, '593237', 'Argumentar aspectos teóricos del proyecto según referentes nacionales e internacionales',                                                                                                          10, 3, TRUE),
(36, '593235', 'Proponer soluciones a las necesidades del contexto según resultados de la investigación',                                                                                                          10, 4, TRUE),

-- Competencia 11: Derechos laborales (38558)
(37, '593243', 'Reconocer el trabajo como factor de movilidad social y transformación vital con referencia a la fenomenología y los derechos fundamentales en el trabajo',                                         11, 1, TRUE),
(38, '593245', 'Valorar la importancia de la ciudadanía laboral con base en el estudio de los derechos humanos y fundamentales en el trabajo',                                                                     11, 2, TRUE),
(39, '593244', 'Practicar los derechos fundamentales en el trabajo de acuerdo con la Constitución Política y los Convenios Internacionales',                                                                       11, 3, TRUE),
(40, '593246', 'Participar en acciones solidarias teniendo en cuenta el ejercicio de los derechos humanos, de los pueblos y de la naturaleza',                                                                     11, 4, TRUE),

-- Competencia 12: Matemáticas (38560)
(41, '593256', 'Identificar modelos matemáticos de acuerdo con los requerimientos del problema planteado en contextos sociales y productivos',                                                                     12, 1, TRUE),
(42, '593258', 'Plantear problemas matemáticos a partir de situaciones generadas en el contexto social y productivo',                                                                                              12, 2, TRUE),
(43, '593255', 'Resolver problemas matemáticos a partir de situaciones generadas en el contexto social y productivo',                                                                                              12, 3, TRUE),
(44, '593257', 'Proponer acciones de mejora frente a los resultados de los procedimientos matemáticos de acuerdo con el problema planteado',                                                                       12, 4, TRUE),

-- Competencia 13: Emprendimiento (38561)
(45, '593342', 'Integrar elementos de la cultura emprendedora teniendo en cuenta el perfil personal y el contexto de desarrollo social',                                                                           13, 1, TRUE),
(46, '593259', 'Caracterizar la idea de negocio teniendo en cuenta las oportunidades y necesidades del sector productivo y social',                                                                                13, 2, TRUE),
(47, '593340', 'Estructurar el plan de negocio de acuerdo con las características empresariales y tendencias de mercado',                                                                                          13, 3, TRUE),
(48, '593341', 'Valorar la propuesta de negocio conforme con su estructura y necesidades del sector productivo y social',                                                                                          13, 4, TRUE),

-- Competencia 14: Implementar software (38356)
(49, '593111', 'Planear actividades de implantación del software de acuerdo con las condiciones del sistema',                                                                                                      14, 1, TRUE),
(50, '593110', 'Desplegar el software de acuerdo con la arquitectura y las políticas establecidas',                                                                                                                14, 2, TRUE),
(51, '593109', 'Documentar el proceso de implantación de software siguiendo estándares de calidad',                                                                                                                14, 3, TRUE),
(52, '593112', 'Implantar el software de acuerdo con los niveles de servicio establecidos con el cliente',                                                                                                         14, 4, TRUE),

-- Competencia 15: Diseñar software (38362)
(53, '593103', 'Elaborar los artefactos de diseño del software siguiendo las prácticas de la metodología seleccionada',                                                                                           15, 1, TRUE),
(54, '593101', 'Estructurar el modelo de datos del software de acuerdo con las especificaciones del análisis',                                                                                                     15, 2, TRUE),
(55, '593100', 'Determinar las características técnicas de la interfaz gráfica del software adoptando estándares',                                                                                                 15, 3, TRUE),
(56, '593102', 'Verificar los entregables de la fase de diseño del software de acuerdo con lo establecido en el informe de análisis',                                                                              15, 4, TRUE),

-- Competencia 16: Propuesta técnica (38367)
(57, '593060', 'Definir especificaciones técnicas del software de acuerdo con las características del software a construir',                                                                                       16, 1, TRUE),
(58, '593062', 'Elaborar propuesta técnica del software de acuerdo con las especificaciones técnicas definidas',                                                                                                   16, 2, TRUE),
(59, '593061', 'Validar las condiciones de la propuesta técnica del software de acuerdo con los intereses de las partes',                                                                                          16, 3, TRUE),

-- Competencia 17: Desarrollar software (38368)
(60, '593106', 'Planear actividades de construcción del software de acuerdo con el diseño establecido',                                                                                                            17, 1, TRUE),
(61, '593107', 'Construir la base de datos para el software a partir del modelo de datos',                                                                                                                         17, 2, TRUE),
(62, '593104', 'Crear componentes front-end del software de acuerdo con el diseño',                                                                                                                                17, 3, TRUE),
(63, '593108', 'Codificar el software de acuerdo con el diseño establecido',                                                                                                                                       17, 4, TRUE),
(64, '593105', 'Realizar pruebas al software para verificar su funcionalidad',                                                                                                                                     17, 5, TRUE),

-- Competencia 18: Calidad de software (38369)
(65, '593146', 'Incorporar actividades de aseguramiento de la calidad del software de acuerdo con estándares de la industria',                                                                                    18, 1, TRUE),
(66, '593144', 'Verificar la calidad del software de acuerdo con las prácticas asociadas en los procesos de desarrollo',                                                                                          18, 2, TRUE),
(67, '593145', 'Realizar actividades de mejora de la calidad del software a partir de los resultados de la verificación',                                                                                          18, 3, TRUE),

-- Competencia 19: Evaluar requisitos (38376)
(68, '592375', 'Planear actividades de análisis de acuerdo con la metodología seleccionada',                                                                                                                      19, 1, TRUE),
(69, '592373', 'Modelar las funciones del software de acuerdo con el informe de requisitos',                                                                                                                      19, 2, TRUE),
(70, '592376', 'Desarrollar procesos lógicos a través de la implementación de algoritmos',                                                                                                                        19, 3, TRUE),
(71, '592374', 'Verificar los modelos realizados en la fase de análisis de acuerdo con lo establecido en el informe de requisitos',                                                                               19, 4, TRUE),

-- Competencia 20: Establecer requisitos (38392)
(72, '593346', 'Caracterizar los procesos de la organización de acuerdo con el software a construir',                                                                                                             20, 1, TRUE),
(73, '593344', 'Recolectar información del software a construir de acuerdo con las necesidades del cliente',                                                                                                      20, 2, TRUE),
(74, '593347', 'Establecer los requisitos del software de acuerdo con la información recolectada',                                                                                                                20, 3, TRUE),
(75, '593345', 'Validar el informe de requisitos de acuerdo con las necesidades del cliente',                                                                                                                     20, 4, TRUE)

ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- 5. APRENDICES DE LA FICHA 2995403
-- Referencia para seed — no reemplaza tabla usuarios de CONINS
-- Estado: EN FORMACION | CONDICIONADO | RETIRO VOLUNTARIO | CANCELADO
-- ============================================================
-- NOTA: Este bloque es referencial. En CONINS los aprendices
-- no tienen tabla propia — son gestionados externamente por
-- Sofía Plus. Se incluye como documentación del grupo.
--
-- CC  1000757527 — JUAN ANDRES MUÑOZ ACEVEDO          — EN FORMACION
-- CC  1000920685 — DIEGO ALEJANDRO MONTOYA VASQUEZ    — EN FORMACION
-- CC  1001419065 — ANDERSON DURANGO ESCOBAR           — EN FORMACION
-- CC  1007108794 — CRISTIAN EXNEYDER ALVAREZ AGUDELO  — CONDICIONADO
-- CC  1017927145 — SEBASTIAN BENITEZ BELEÑO           — EN FORMACION
-- CC  1018233099 — JUAN MANUEL VELEZ ARIAS            — EN FORMACION
-- CC  1020416607 — MIGUEL ANGEL MESA FLOREZ           — RETIRO VOLUNTARIO
-- CC  1022003419 — LUCAS VASQUEZ ZAPATA               — EN FORMACION
-- CC  1022144753 — MAURICIO VILLEGAS CALDERON         — EN FORMACION
-- CC  1029300244 — MAIRIDH ESLEDY MONSALVE CHAVARRIA  — EN FORMACION
-- CC  1033180364 — NICOLAS ALVAREZ MACIAS             — EN FORMACION
-- CC  1033181625 — LAURA SOFIA POSADA LOPEZ           — EN FORMACION
-- CC  1035974059 — JUAN CAMILO LONDOÑO ESPINOSA       — CONDICIONADO
-- CC  1035974144 — EMANUEL COLORADO GONZALEZ          — EN FORMACION
-- CC  1036602108 — JOHN EDDISSON MORA CASTAÑEDA       — RETIRO VOLUNTARIO
-- CC  1036615535 — ANDREA ARCILA CANO                 — EN FORMACION
-- CC  1036657253 — MAICOL ESTIVEN CORDOBA LONDOÑO     — CONDICIONADO
-- CC  1036680506 — JHUNIOR FRANCO GARCIA              — EN FORMACION
-- CC  1036685532 — ELKIN ARTURO HERNANDEZ BERRIO      — RETIRO VOLUNTARIO
-- CC  1037608213 — DANIEL JARAMILLO PALACIO           — EN FORMACION
-- CC  1037640936 — DANIEL MUÑOZ URREA                 — RETIRO VOLUNTARIO
-- CC  1037653938 — STEFANNY MESA MARULANDA            — CANCELADO
-- CC  1038339243 — GABRIEL JAIME NANCLARES MAZO       — CANCELADO
-- CC  1040573114 — SOFIA MORALES ARANGO               — EN FORMACION
-- TI  1041980502 — YHORMAN STICK GARCES BALLESTAS     — EN FORMACION
-- CC  1093590537 — MIGUEL ANGEL BOTELLO VEGA          — CONDICIONADO
-- CC  1113152089 — SEBASTIAN GARCIA CONTRERAS         — CONDICIONADO
-- CC  1148206234 — MARCO ALEXANDER MONSALVE TUBERQUIA — RETIRO VOLUNTARIO
-- CC  1152466800 — DANIELA GUTIERREZ MONTOYA          — RETIRO VOLUNTARIO
-- PPT 6436573    — DAYANGELA DIAZ ARCILA              — EN FORMACION
-- PPT 6631043    — ANGEL FAVIAN ROMERO NAVARRO        — EN FORMACION
-- CC  92549388   — JAIR ENRIQUE GONZALEZ BUELVAS      — EN FORMACION
--
-- Total: 32 aprendices
-- Activos (EN FORMACION): 19
-- Condicionados: 5
-- Retiro voluntario: 6
-- Cancelados: 2
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- RESUMEN DEL SEED
-- ============================================================
-- programas:    1 registro  (228118 — ADSO)
-- fichas:       1 registro  (2995403)
-- competencias: 20 registros (7 técnicas + 12 transversales + 1 etapa productiva)
-- raps:         75 registros
-- aprendices:   32 (referencial — comentado)
-- ============================================================
