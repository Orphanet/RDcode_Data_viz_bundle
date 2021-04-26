const baseUrl = "https://api.orphacode.org/"; // RDcode API url
//const baseUrl = "http://localhost:8080/"; // RDcode API url
const suggestDelay = 500; // time in ms needed to autolaunch the suggest search
var paginationSize = 5; // number of lines displayed for the search
var tooltip = {};

tooltip.DI_ORPHAcode = "A unique and time-stable numerical identifier attributed randomly by the database upon creation of the entity. Currently, the ORPHACode is made up of one to six digits. In the future, number of digits can expand.";
tooltip.DI_Def_Tooltip = "Definition of the clinical entity.";
tooltip.DI_Syn_Tooltip = "Terms that are perfectly equivalent to the preferred term. The number of synonyms is indefinite and may vary depending on the language of translation. Acronyms commonly used to describe the disease are included as synonyms.";
tooltip.DI_ClassificationLevel_Tooltip = "Hierarchical levels of the clinical entity that determine the level of precision of each diagnosis included in the nomenclature. Can be either Group of disorders, Disorder or Subtype of disorder and only one by clinical entity.";
tooltip.DI_Typology_Tooltip = "Type of the clinical entity. Can be either Category, Clinical group, Disease, Clinical syndrome, Malformation syndrome, Biological anomaly, Morphological anomaly, Particular clinical situation in a disease or syndrome, Etiological subtype, Clinical subtype or Histopathological subtype and only one by clinical entity.";
tooltip.DI_URL_Text = "Stable URL pointing to the specific page of a given disease on the Orphanet website.";
tooltip.DI_Status_Tooltip = "Status of the clinical entity. Can be either “Active”, “Inactive: Deprecated”, “Inactive: Obsolete”, “Inactive: Non rare disease in Europe” and only one by clinical entity.";
tooltip.DI_InactiveTarget_Tooltip = "Relationship between an inactive clinical entity and an active one advised to be used in replacement.";
tooltip.DI_Aggreg_Tooltip = "Recommended ORPHAcode in Europe for data sharing and statistical reporting. It encompasses the list of ORPHAcodes of Disorder typology, excluding groups and subtypes.";
tooltip.DI_ICD10_Tooltip = "Closeness relationship between an ORPHAcode and an ICD-10 code. Can be either E (Exact), NTBT (Narrow term to broad term), BTNT (Broad term to narrow term), ND (Not yet decided/unable to decide), W (Wrong)";
tooltip.DI_OMIM_Tooltip = "Closeness relationship between an ORPHAcode and an OMIM code. Can be either E (Exact), NTBT (Narrow term to broad term), BTNT (Broad term to narrow term), ND (Not yet decided/unable to decide), W (Wrong)";

// Color scales

// See https://observablehq.com/@d3/color-schemes
//colorScaleCat10 = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"];
//colorScaleTab10 = ["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"];
colorScalePastel1 = ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"];

colorScale = colorScalePastel1;

// Classification level colors
classificationLevelColors = {"Group of disorders" : colorScale[1], "Disorder" : colorScale[2], "Subtype of disorder" : colorScale[3]}