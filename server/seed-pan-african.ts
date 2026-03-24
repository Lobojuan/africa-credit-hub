import { db } from "./db";
import { organizations, borrowers, creditAccounts, creditInquiries, auditLogs, users } from "@shared/schema";
import { count, eq } from "drizzle-orm";

const AFRICAN_COUNTRIES = [
  { name: "Algeria", code: "DZA", currency: "DZD", phone: "+213", cities: ["Algiers", "Oran", "Constantine", "Annaba"], banks: ["Banque Nationale d'Algérie", "Crédit Populaire d'Algérie"], firstNames: ["Youssef", "Amina", "Mohamed", "Fatima", "Rachid", "Djamila"], lastNames: ["Boudiaf", "Benali", "Hamidi", "Saidi", "Mesbah", "Khelifi"], companies: ["Sonatrach Services", "Cevital Group", "Algiers Trading Co."] },
  { name: "Angola", code: "AGO", currency: "AOA", phone: "+244", cities: ["Luanda", "Huambo", "Lobito", "Benguela"], banks: ["Banco Angolano de Investimentos", "Banco BIC Angola"], firstNames: ["João", "Maria", "Carlos", "Ana", "Pedro", "Luísa"], lastNames: ["Silva", "Santos", "Ferreira", "Costa", "Pereira", "Neto"], companies: ["Sonangol Partners", "Angola LNG Ltd", "Luanda Logistics"] },
  { name: "Benin", code: "BEN", currency: "XOF", phone: "+229", cities: ["Cotonou", "Porto-Novo", "Parakou"], banks: ["Bank of Africa Benin", "Ecobank Benin"], firstNames: ["Kossi", "Adjo", "Koffi", "Afiavi", "Codjo", "Afi"], lastNames: ["Houessou", "Agossou", "Ahouandjinou", "Dossou", "Houngbedji", "Gbenou"], companies: ["Bénin Cashew Export", "Port Autonome de Cotonou", "Cotonou Commerce"] },
  { name: "Botswana", code: "BWA", currency: "BWP", phone: "+267", cities: ["Gaborone", "Francistown", "Maun"], banks: ["First National Bank Botswana", "Barclays Botswana"], firstNames: ["Thabo", "Mpho", "Kagiso", "Naledi", "Tshepo", "Kelebogile"], lastNames: ["Modise", "Mosweu", "Kgosimore", "Seretse", "Molefe", "Tsheko"], companies: ["Debswana Diamond Co.", "Botswana Meat Commission", "Gaborone Glass"] },
  { name: "Burkina Faso", code: "BFA", currency: "XOF", phone: "+226", cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou"], banks: ["Coris Bank International", "Bank of Africa BF"], firstNames: ["Moussa", "Mariam", "Ibrahim", "Aïssata", "Ousmane", "Fatoumata"], lastNames: ["Ouédraogo", "Compaoré", "Kaboré", "Sawadogo", "Traoré", "Zongo"], companies: ["Burkina Mining Corp", "Ouaga Textiles SA", "Sahel Agri"] },
  { name: "Burundi", code: "BDI", currency: "BIF", phone: "+257", cities: ["Bujumbura", "Gitega", "Ngozi"], banks: ["Banque Commerciale du Burundi", "Interbank Burundi"], firstNames: ["Jean", "Marie", "Pierre", "Jeanne", "Emmanuel", "Espérance"], lastNames: ["Ndayishimiye", "Nkurunziza", "Niyonzima", "Hakizimana", "Irakoze", "Bizimana"], companies: ["Bujumbura Trading", "Burundi Coffee Export", "Gitega Construction"] },
  { name: "Cabo Verde", code: "CPV", currency: "CVE", phone: "+238", cities: ["Praia", "Mindelo", "Santa Maria"], banks: ["Banco Comercial do Atlântico", "Caixa Económica de Cabo Verde"], firstNames: ["José", "Maria", "António", "Rosa", "Manuel", "Celina"], lastNames: ["Lopes", "Tavares", "Monteiro", "Fonseca", "Brito", "Correia"], companies: ["Cabo Verde Airlines Services", "Mindelo Fisheries", "Praia Port Services"] },
  { name: "Cameroon", code: "CMR", currency: "XAF", phone: "+237", cities: ["Douala", "Yaoundé", "Bamenda", "Bafoussam"], banks: ["Afriland First Bank", "Société Générale Cameroun"], firstNames: ["Paul", "Esther", "Samuel", "Grace", "Daniel", "Patience"], lastNames: ["Biya", "Nganou", "Mbarga", "Tchouameni", "Eto'o", "Foning"], companies: ["Douala Port Authority", "Cameroon Dev Corp", "Bamenda Coffee"] },
  { name: "Central African Republic", code: "CAF", currency: "XAF", phone: "+236", cities: ["Bangui", "Bimbo", "Berbérati"], banks: ["Commercial Bank Centrafrique", "Ecobank Centrafrique"], firstNames: ["André", "Bernadette", "François", "Christine", "Joseph", "Madeleine"], lastNames: ["Touadéra", "Nguérékata", "Kolingba", "Ziguélé", "Bozizé", "Ngon"], companies: ["Bangui Mining", "Centrafrique Transport", "Oubangui Trading"] },
  { name: "Chad", code: "TCD", currency: "XAF", phone: "+235", cities: ["N'Djamena", "Moundou", "Abéché"], banks: ["Commercial Bank Tchad", "Société Générale Tchad"], firstNames: ["Hassan", "Halima", "Mahamat", "Khadija", "Adam", "Amina"], lastNames: ["Déby", "Moussa", "Abderaman", "Ali", "Haroun", "Oumar"], companies: ["SociétéTchadienne de Pétrole", "Chad Cotton Corp", "N'Djamena Construction"] },
  { name: "Comoros", code: "COM", currency: "KMF", phone: "+269", cities: ["Moroni", "Mutsamudu", "Fomboni"], banks: ["Banque de Développement des Comores", "Exim Bank Comores"], firstNames: ["Ahmed", "Fatima", "Ali", "Mariam", "Said", "Zainab"], lastNames: ["Abdallah", "Mohamed", "Ibrahim", "Hassan", "Salim", "Omar"], companies: ["Comores Vanilla Export", "Moroni Fisheries", "Anjouan Cloves"] },
  { name: "Congo (Brazzaville)", code: "COG", currency: "XAF", phone: "+242", cities: ["Brazzaville", "Pointe-Noire", "Dolisie"], banks: ["La Congolaise de Banque", "BGFI Bank Congo"], firstNames: ["Sylvestre", "Carine", "Patrick", "Viviane", "Guy", "Nadège"], lastNames: ["Itoua", "Mouamba", "Nguesso", "Okamba", "Mbemba", "Lékoundzou"], companies: ["Congo Mining Group", "Pointe-Noire Oil Services", "Brazza Logistics"] },
  { name: "Congo (DRC)", code: "COD", currency: "CDF", phone: "+243", cities: ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Goma"], banks: ["Trust Merchant Bank", "Rawbank"], firstNames: ["Patrick", "Chantal", "Félix", "Denise", "Christian", "Nathalie"], lastNames: ["Tshisekedi", "Kabila", "Katumbi", "Mukwege", "Lumumba", "Mobutu"], companies: ["Gécamines Services", "Kinshasa Trading Corp", "Katanga Mining"] },
  { name: "Côte d'Ivoire", code: "CIV", currency: "XOF", phone: "+225", cities: ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro"], banks: ["Société Générale Côte d'Ivoire", "NSIA Banque CI"], firstNames: ["Seydou", "Aminata", "Yao", "Adjoua", "Kouadio", "Marie-Laure"], lastNames: ["Ouattara", "Koné", "Bédié", "Gbagbo", "Drogba", "Touré"], companies: ["Abidjan Port Services", "Ivorian Cocoa Export", "Bouaké Textiles"] },
  { name: "Djibouti", code: "DJI", currency: "DJF", phone: "+253", cities: ["Djibouti City", "Ali Sabieh", "Tadjoura"], banks: ["Banque pour le Commerce et l'Industrie", "CAC International Bank"], firstNames: ["Ismaël", "Hodan", "Abdourahman", "Safia", "Omar", "Asha"], lastNames: ["Guelleh", "Dini", "Boreh", "Aden", "Elmi", "Warsama"], companies: ["Djibouti Port Authority", "Free Zone Services", "Red Sea Trading"] },
  { name: "Egypt", code: "EGY", currency: "EGP", phone: "+20", cities: ["Cairo", "Alexandria", "Giza", "Luxor", "Sharm El Sheikh"], banks: ["National Bank of Egypt", "Commercial International Bank"], firstNames: ["Ahmed", "Nour", "Mohamed", "Yasmin", "Omar", "Salma"], lastNames: ["El-Sisi", "Mubarak", "Sadat", "Hassan", "Khalil", "Fawzy"], companies: ["Orascom Construction", "Suez Canal Services", "Cairo Pharma Group"] },
  { name: "Equatorial Guinea", code: "GNQ", currency: "XAF", phone: "+240", cities: ["Malabo", "Bata", "Ebebiyín"], banks: ["BGFI Bank GE", "CCEI Bank GE"], firstNames: ["Teodoro", "María", "Francisco", "Carmen", "Juan", "Ana"], lastNames: ["Obiang", "Nguema", "Mangue", "Asumu", "Mokuy", "Nsue"], companies: ["GE Petrol Services", "Malabo Construction", "Bata Trading"] },
  { name: "Eritrea", code: "ERI", currency: "ERN", phone: "+291", cities: ["Asmara", "Keren", "Massawa"], banks: ["Commercial Bank of Eritrea", "Housing & Commerce Bank"], firstNames: ["Bereket", "Luwam", "Yonas", "Miriam", "Dawit", "Senait"], lastNames: ["Habte", "Tesfay", "Gebremedhin", "Weldeab", "Afewerki", "Mekonnen"], companies: ["Eritrean Mining Corp", "Asmara Leather Goods", "Red Sea Fisheries"] },
  { name: "Eswatini", code: "SWZ", currency: "SZL", phone: "+268", cities: ["Mbabane", "Manzini", "Lobamba"], banks: ["First National Bank Eswatini", "Standard Bank Eswatini"], firstNames: ["Sipho", "Nomcebo", "Themba", "Lindiwe", "Bongani", "Nokuthula"], lastNames: ["Dlamini", "Mamba", "Nkambule", "Simelane", "Maseko", "Shongwe"], companies: ["Eswatini Sugar Association", "Mbabane Construction", "Royal Eswatini Textiles"] },
  { name: "Ethiopia", code: "ETH", currency: "ETB", phone: "+251", cities: ["Addis Ababa", "Dire Dawa", "Bahir Dar", "Mekelle", "Hawassa"], banks: ["Commercial Bank of Ethiopia", "Dashen Bank", "Awash International Bank"], firstNames: ["Abebe", "Tigist", "Solomon", "Meron", "Tadesse", "Hiwot"], lastNames: ["Tesfaye", "Kebede", "Haile", "Desta", "Bekele", "Gebre"], companies: ["Ethiopian Airlines Services", "Ethio Telecom Corp", "Hawassa Industrial Park"] },
  { name: "Gabon", code: "GAB", currency: "XAF", phone: "+241", cities: ["Libreville", "Port-Gentil", "Franceville"], banks: ["BGFI Bank Gabon", "Union Gabonaise de Banque"], firstNames: ["Pierre", "Paulette", "Jean", "Chantal", "Ali", "Rose"], lastNames: ["Bongo", "Ping", "Ntoutoume", "Mba", "Ogoula", "Ndong"], companies: ["Gabon Oil Corp", "Libreville Port Services", "COMILOG Mining"] },
  { name: "Ghana", code: "GHA", currency: "GHS", phone: "+233", cities: ["Accra", "Kumasi", "Tamale", "Cape Coast", "Takoradi"], banks: ["GCB Bank", "Ecobank Ghana", "Fidelity Bank Ghana", "CalBank"], firstNames: ["Kwame", "Ama", "Kofi", "Akua", "Yaw", "Abena"], lastNames: ["Mensah", "Boateng", "Asante", "Osei", "Appiah", "Annan"], companies: ["Gold Fields Ghana", "Tullow Oil Ghana", "Ghana Cocoa Board"] },
  { name: "Gambia", code: "GMB", currency: "GMD", phone: "+220", cities: ["Banjul", "Serekunda", "Brikama"], banks: ["Trust Bank Gambia", "Standard Chartered Gambia"], firstNames: ["Lamin", "Isatou", "Ousman", "Fatou", "Musa", "Mariama"], lastNames: ["Barrow", "Jammeh", "Ceesay", "Jallow", "Touray", "Bojang"], companies: ["Gambia Groundnut Corp", "Banjul Port Authority", "Gambian River Transport"] },
  { name: "Guinea", code: "GIN", currency: "GNF", phone: "+224", cities: ["Conakry", "Nzérékoré", "Kankan"], banks: ["Société Générale de Banques en Guinée", "Ecobank Guinée"], firstNames: ["Mamadou", "Fatoumata", "Ibrahima", "Aissatou", "Sékou", "Mariama"], lastNames: ["Condé", "Diallo", "Barry", "Bah", "Camara", "Sylla"], companies: ["Guinea Bauxite Corp", "Conakry Mining Services", "Simandou Resources"] },
  { name: "Guinea-Bissau", code: "GNB", currency: "XOF", phone: "+245", cities: ["Bissau", "Bafatá", "Gabú"], banks: ["Banco da África Ocidental", "Ecobank Guiné-Bissau"], firstNames: ["Umaro", "Aminata", "Braima", "Fatu", "Domingos", "Rosa"], lastNames: ["Sissoco", "Vieira", "Sanhá", "Nhamadjo", "Mendes", "Cabral"], companies: ["Bissau Cashew Export", "Guinea-Bissau Fisheries", "Bijagós Trading"] },
  { name: "Kenya", code: "KEN", currency: "KES", phone: "+254", cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"], banks: ["Kenya Commercial Bank", "Equity Bank Kenya", "Co-operative Bank of Kenya"], firstNames: ["James", "Wanjiku", "Peter", "Akinyi", "John", "Amina"], lastNames: ["Kamau", "Ochieng", "Mwangi", "Njoroge", "Kipchoge", "Wafula"], companies: ["Safaricom Services Ltd", "Kenya Airways Corp", "East African Breweries"] },
  { name: "Lesotho", code: "LSO", currency: "LSL", phone: "+266", cities: ["Maseru", "Teyateyaneng", "Mafeteng"], banks: ["Lesotho PostBank", "Standard Lesotho Bank"], firstNames: ["Thabo", "Mamello", "Lerato", "Palesa", "Thabiso", "Lineo"], lastNames: ["Thabane", "Mosisili", "Mokhehle", "Letsie", "Majoro", "Sekonyela"], companies: ["Letseng Diamonds", "Maseru Textiles", "Lesotho Highlands Water"] },
  { name: "Liberia", code: "LBR", currency: "LRD", phone: "+231", cities: ["Monrovia", "Gbarnga", "Buchanan"], banks: ["International Bank Liberia", "Global Bank Liberia"], firstNames: ["George", "Ellen", "Charles", "Ruth", "Emmanuel", "Martha"], lastNames: ["Weah", "Sirleaf", "Taylor", "Johnson", "Boakai", "Cooper"], companies: ["Firestone Liberia", "Monrovia Port Corp", "ArcelorMittal Liberia"] },
  { name: "Libya", code: "LBY", currency: "LYD", phone: "+218", cities: ["Tripoli", "Benghazi", "Misrata"], banks: ["Libyan Arab Foreign Bank", "Wahda Bank"], firstNames: ["Khalid", "Salma", "Omar", "Aisha", "Tariq", "Fatima"], lastNames: ["Haftar", "Sarraj", "Gaddafi", "Dbeibeh", "Bashir", "Fakhri"], companies: ["National Oil Corp Libya", "Tripoli Construction", "Libyan Iron & Steel"] },
  { name: "Madagascar", code: "MDG", currency: "MGA", phone: "+261", cities: ["Antananarivo", "Toamasina", "Antsirabe"], banks: ["Bank of Africa Madagascar", "BNI Madagascar"], firstNames: ["Andry", "Mialy", "Hery", "Voahangy", "Lalao", "Naina"], lastNames: ["Rajoelina", "Ravalomanana", "Rajaonarimampianina", "Ratsiraka", "Rabemananjara", "Andrianampoinimerina"], companies: ["Madagascar Vanilla Export", "Ambatovy Mining", "Tana Textiles"] },
  { name: "Malawi", code: "MWI", currency: "MWK", phone: "+265", cities: ["Lilongwe", "Blantyre", "Mzuzu"], banks: ["National Bank of Malawi", "Standard Bank Malawi"], firstNames: ["Lazarus", "Joyce", "Peter", "Grace", "Gift", "Mercy"], lastNames: ["Chakwera", "Banda", "Mutharika", "Chilima", "Gondwe", "Msowoya"], companies: ["Illovo Sugar Malawi", "Lilongwe Trading", "Malawi Tobacco Auth."] },
  { name: "Mali", code: "MLI", currency: "XOF", phone: "+223", cities: ["Bamako", "Sikasso", "Mopti", "Timbuktu"], banks: ["Bank of Africa Mali", "BDM SA"], firstNames: ["Amadou", "Oumou", "Modibo", "Fatoumata", "Boubacar", "Kadiatou"], lastNames: ["Keita", "Touré", "Traoré", "Cissé", "Diarra", "Coulibaly"], companies: ["Randgold Mali", "Bamako Cotton Corp", "Mali Manganese"] },
  { name: "Mauritania", code: "MRT", currency: "MRU", phone: "+222", cities: ["Nouakchott", "Nouadhibou", "Kaédi"], banks: ["Générale de Banque de Mauritanie", "Banque Populaire de Mauritanie"], firstNames: ["Mohamed", "Mariam", "Abdel", "Aïcha", "Ely", "Maryam"], lastNames: ["Ghazouani", "Abdel Aziz", "Vall", "Taya", "Bamba", "Ould"], companies: ["SNIM Mining Corp", "Mauritania Fisheries", "Nouakchott Port"] },
  { name: "Mauritius", code: "MUS", currency: "MUR", phone: "+230", cities: ["Port Louis", "Curepipe", "Vacoas-Phoenix"], banks: ["Mauritius Commercial Bank", "State Bank of Mauritius"], firstNames: ["Raj", "Anisha", "Avinash", "Priya", "Vikram", "Devi"], lastNames: ["Jugnauth", "Ramgoolam", "Lutchmeenaraidoo", "Boolell", "Duval", "Seetanah"], companies: ["Air Mauritius Services", "Mauritius Sugar Syndicate", "Port Louis Freeport"] },
  { name: "Morocco", code: "MAR", currency: "MAD", phone: "+212", cities: ["Casablanca", "Rabat", "Marrakech", "Fez", "Tangier"], banks: ["Attijariwafa Bank", "BMCE Bank of Africa", "Banque Populaire du Maroc"], firstNames: ["Youssef", "Fatima-Zahra", "Mehdi", "Khadija", "Hamza", "Sanaa"], lastNames: ["Alaoui", "Bennis", "El Fassi", "Berrada", "Tazi", "Chraibi"], companies: ["OCP Group", "Royal Air Maroc Services", "Casablanca Finance City"] },
  { name: "Mozambique", code: "MOZ", currency: "MZN", phone: "+258", cities: ["Maputo", "Beira", "Nampula", "Matola"], banks: ["Millennium BIM", "Standard Bank Mozambique"], firstNames: ["Filipe", "Celeste", "Carlos", "Graça", "Armando", "Lurdes"], lastNames: ["Nyusi", "Machel", "Guebuza", "Chissano", "Dhlakama", "Mondlane"], companies: ["Mozal Aluminium", "Maputo Port Services", "Cahora Bassa HCB"] },
  { name: "Namibia", code: "NAM", currency: "NAD", phone: "+264", cities: ["Windhoek", "Walvis Bay", "Swakopmund"], banks: ["First National Bank Namibia", "Bank Windhoek"], firstNames: ["Hage", "Monica", "Nangolo", "Netumbo", "Nghidinwa", "Saara"], lastNames: ["Geingob", "Nujoma", "Pohamba", "Angula", "Gurirab", "Iivula-Ithana"], companies: ["Namibia Breweries", "Rössing Uranium", "Walvis Bay Port"] },
  { name: "Niger", code: "NER", currency: "XOF", phone: "+227", cities: ["Niamey", "Zinder", "Maradi"], banks: ["Bank of Africa Niger", "Ecobank Niger"], firstNames: ["Mahamadou", "Rabi", "Abdou", "Hadiza", "Issoufou", "Fati"], lastNames: ["Bazoum", "Issoufou", "Tandja", "Wanké", "Ousmane", "Garba"], companies: ["Niger Uranium Mining", "Niamey Agro Industries", "SONIDEP Petroleum"] },
  { name: "Nigeria", code: "NGA", currency: "NGN", phone: "+234", cities: ["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan"], banks: ["First Bank of Nigeria", "Guaranty Trust Bank", "Zenith Bank", "Access Bank"], firstNames: ["Oluwaseun", "Ngozi", "Chidi", "Amina", "Emeka", "Funke"], lastNames: ["Adebayo", "Okafor", "Ibrahim", "Okonkwo", "Bello", "Adekunle"], companies: ["Dangote Industries", "MTN Nigeria Services", "Oando Oil & Gas"] },
  { name: "Rwanda", code: "RWA", currency: "RWF", phone: "+250", cities: ["Kigali", "Butare", "Gisenyi", "Musanze"], banks: ["Bank of Kigali", "I&M Bank Rwanda"], firstNames: ["Jean-Paul", "Diane", "Emmanuel", "Jeannette", "Patrick", "Claudine"], lastNames: ["Kagame", "Mushikiwabo", "Ntaganda", "Habyarimana", "Rusesabagina", "Uwimana"], companies: ["Rwanda Development Board", "Kigali Heights Corp", "Inyange Industries"] },
  { name: "São Tomé and Príncipe", code: "STP", currency: "STN", phone: "+239", cities: ["São Tomé", "Santo Amaro", "Neves"], banks: ["Banco Internacional de S. Tomé e Príncipe", "Afriland First Bank STP"], firstNames: ["Carlos", "Maria", "Patrice", "Ana", "Manuel", "Rosa"], lastNames: ["Vila Nova", "Trovoada", "Pinto da Costa", "Carvalho", "Bonfim", "Afonso"], companies: ["STP Cocoa Export", "Água Grande Trading", "Príncipe Eco Resort"] },
  { name: "Senegal", code: "SEN", currency: "XOF", phone: "+221", cities: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor"], banks: ["Société Générale Sénégal", "CBAO Groupe Attijariwafa"], firstNames: ["Macky", "Aminata", "Abdoulaye", "Sokhna", "Moustapha", "Coumba"], lastNames: ["Sall", "Wade", "Diop", "Ndiaye", "Fall", "Sow"], companies: ["Sonatel Group", "Port Autonome de Dakar", "Industries Chimiques du Sénégal"] },
  { name: "Seychelles", code: "SYC", currency: "SCR", phone: "+248", cities: ["Victoria", "Anse Royale", "Beau Vallon"], banks: ["Seychelles Commercial Bank", "Nouvobanq"], firstNames: ["Danny", "Marie-Louise", "James", "Sylvette", "Patrick", "Anne"], lastNames: ["Faure", "Michel", "René", "Mancham", "Ramkalawan", "Albert"], companies: ["Seychelles Tourism Board", "Indian Ocean Tuna Ltd", "Victoria Port Services"] },
  { name: "Sierra Leone", code: "SLE", currency: "SLE", phone: "+232", cities: ["Freetown", "Bo", "Kenema", "Makeni"], banks: ["Sierra Leone Commercial Bank", "Rokel Commercial Bank", "Union Trust Bank"], firstNames: ["Julius", "Fatima", "Ernest", "Isata", "Mohamed", "Aminata"], lastNames: ["Maada Bio", "Koroma", "Kabbah", "Kamara", "Sesay", "Bangura"], companies: ["Sierra Rutile Mining", "Freetown Port Authority", "Bo Trading Corp"] },
  { name: "Somalia", code: "SOM", currency: "SOS", phone: "+252", cities: ["Mogadishu", "Hargeisa", "Kismayo"], banks: ["Dahabshiil Bank", "Salaam Somali Bank"], firstNames: ["Hassan", "Halima", "Mohamed", "Asha", "Abdullahi", "Fartun"], lastNames: ["Sheikh Mohamud", "Farmaajo", "Abdullahi", "Ali", "Guled", "Adan"], companies: ["Hormuud Telecom", "Mogadishu Port Services", "Somali Livestock Export"] },
  { name: "South Africa", code: "ZAF", currency: "ZAR", phone: "+27", cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"], banks: ["Standard Bank", "FirstRand Bank", "Absa Bank", "Nedbank"], firstNames: ["Sipho", "Thandiwe", "Mandla", "Nomzamo", "Themba", "Lerato"], lastNames: ["Ramaphosa", "Zuma", "Mbeki", "Mandela", "Tutu", "Sisulu"], companies: ["Sasol Ltd", "Shoprite Holdings", "MTN South Africa"] },
  { name: "South Sudan", code: "SSD", currency: "SSP", phone: "+211", cities: ["Juba", "Wau", "Malakal"], banks: ["KCB South Sudan", "Equity Bank South Sudan"], firstNames: ["Salva", "Rebecca", "Riek", "Angelina", "James", "Mary"], lastNames: ["Kiir", "Garang", "Machar", "Teny", "Wani", "Ayen"], companies: ["Nile Petroleum Corp", "Juba Trading House", "South Sudan Logistics"] },
  { name: "Sudan", code: "SDN", currency: "SDG", phone: "+249", cities: ["Khartoum", "Omdurman", "Port Sudan"], banks: ["Bank of Khartoum", "Faisal Islamic Bank Sudan"], firstNames: ["Abdel Fattah", "Hala", "Omar", "Amira", "Mohamed", "Rasha"], lastNames: ["Al-Burhan", "Al-Bashir", "Hamdok", "Mahdi", "Mirghani", "Sadiq"], companies: ["DAL Group", "Khartoum Refinery", "Port Sudan Logistics"] },
  { name: "Tanzania", code: "TZA", currency: "TZS", phone: "+255", cities: ["Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Zanzibar City"], banks: ["CRDB Bank", "NMB Bank Tanzania", "NBC Bank"], firstNames: ["John", "Samia", "Jakaya", "Asha", "Benjamin", "Fatma"], lastNames: ["Magufuli", "Suluhu", "Kikwete", "Mwinyi", "Mkapa", "Nyerere"], companies: ["Tanzania Breweries", "Vodacom Tanzania", "Kilimanjaro Coffee Corp"] },
  { name: "Togo", code: "TGO", currency: "XOF", phone: "+228", cities: ["Lomé", "Sokodé", "Kara"], banks: ["Ecobank Togo", "UTB Togo"], firstNames: ["Faure", "Victoire", "Komi", "Afi", "Kossi", "Akofa"], lastNames: ["Gnassingbé", "Eyadéma", "Olympio", "Kodjo", "Agbéyomé", "Klassou"], companies: ["Port Autonome de Lomé", "Togo Phosphate Mining", "Lomé Free Zone"] },
  { name: "Tunisia", code: "TUN", currency: "TND", phone: "+216", cities: ["Tunis", "Sfax", "Sousse", "Kairouan"], banks: ["Banque Internationale Arabe de Tunisie", "Amen Bank"], firstNames: ["Kaïs", "Leila", "Béji", "Olfa", "Youssef", "Sarra"], lastNames: ["Saied", "Ben Ali", "Essebsi", "Marzouki", "Jebali", "Ghannouchi"], companies: ["Tunisair Services", "Groupe Chimique Tunisien", "Sfax Olive Oil"] },
  { name: "Uganda", code: "UGA", currency: "UGX", phone: "+256", cities: ["Kampala", "Entebbe", "Jinja", "Gulu", "Mbarara"], banks: ["Stanbic Bank Uganda", "DFCU Bank", "Centenary Bank"], firstNames: ["Yoweri", "Janet", "Robert", "Winnie", "Andrew", "Juliet"], lastNames: ["Museveni", "Katureebe", "Kayihura", "Byanyima", "Mwenda", "Tumusiime"], companies: ["MTN Uganda Services", "Uganda Breweries", "Roofings Group"] },
  { name: "Zambia", code: "ZMB", currency: "ZMW", phone: "+260", cities: ["Lusaka", "Kitwe", "Ndola", "Livingstone"], banks: ["Zanaco Bank", "Stanbic Bank Zambia", "First National Bank Zambia"], firstNames: ["Hakainde", "Esther", "Edgar", "Inonge", "Michael", "Charity"], lastNames: ["Hichilema", "Lungu", "Sata", "Mwanawasa", "Banda", "Chiluba"], companies: ["Konkola Copper Mines", "Zambia Sugar", "Lusaka Water & Sewerage"] },
  { name: "Zimbabwe", code: "ZWE", currency: "ZWL", phone: "+263", cities: ["Harare", "Bulawayo", "Chitungwiza", "Mutare"], banks: ["CBZ Bank", "FBC Bank", "Stanbic Bank Zimbabwe"], firstNames: ["Emmerson", "Grace", "Morgan", "Joice", "Tendai", "Rutendo"], lastNames: ["Mnangagwa", "Mugabe", "Tsvangirai", "Mujuru", "Biti", "Chamisa"], companies: ["Zimplats Mining", "Econet Wireless", "Delta Beverages"] },
];

if (AFRICAN_COUNTRIES.length !== 54) {
  throw new Error(`Expected 54 African countries but got ${AFRICAN_COUNTRIES.length}`);
}

const LOAN_TYPES = ["personal_loan", "business_loan", "mortgage", "overdraft", "microfinance", "trade_finance", "vehicle_loan", "agricultural_loan"];
const STATUSES: Array<"current" | "delinquent" | "default" | "closed" | "restructured"> = ["current", "current", "current", "current", "current", "delinquent", "delinquent", "default", "closed", "restructured"];
const SECTORS = ["Banking", "Telecommunications", "Agriculture", "Manufacturing", "Mining", "Energy", "Government", "Healthcare", "Education", "Technology", "Transportation", "Real Estate", "Retail", "Tourism", "Construction"];
const COLLATERAL_TYPES = ["Property", "Equipment & Machinery", "Vehicles", "Real Estate", "Inventory", "Receivables", "None"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDec(min: number, max: number): string { return (min + Math.random() * (max - min)).toFixed(2); }
function slugify(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export async function seedPanAfrican() {
  const [borrowerCount] = await db.select({ value: count() }).from(borrowers);
  if (Number(borrowerCount.value) > 500) {
    console.log(`Pan-African: ${borrowerCount.value} borrowers already exist, skipping`);
    return;
  }

  const [adminUser] = await db.select().from(users).limit(1);
  if (!adminUser) {
    console.log("Pan-African: No admin user found, skipping");
    return;
  }

  const existingOrgs = await db.select({ name: organizations.name }).from(organizations);
  const existingOrgNames = new Set(existingOrgs.map(o => o.name));

  console.log(`Pan-African seed: Generating data for ${AFRICAN_COUNTRIES.length} countries...`);

  const BATCH = 200;
  let totalBorrowers = 0;
  let totalAccounts = 0;
  let totalInquiries = 0;
  let totalOrgs = 0;

  for (const country of AFRICAN_COUNTRIES) {
    const orgValues: any[] = [];
    const orgIds: string[] = [];

    for (const bankName of country.banks) {
      if (existingOrgNames.has(bankName)) continue;
      orgValues.push({
        name: bankName,
        slug: slugify(bankName) + "-" + country.code.toLowerCase(),
        type: "bank" as const,
        status: "active" as const,
        country: country.name,
        contactEmail: `info@${slugify(bankName)}.${country.code.toLowerCase()}`,
        contactPhone: country.phone + "100000000",
        subscriptionTier: "standard",
        maxUsers: 10,
      });
    }
    if (orgValues.length > 0) {
      const created = await db.insert(organizations).values(orgValues).returning();
      for (const o of created) orgIds.push(o.id);
      totalOrgs += created.length;
    }

    if (orgIds.length === 0) {
      const existingCountryOrgs = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.country, country.name));
      for (const o of existingCountryOrgs) orgIds.push(o.id);
    }
    const assignOrg = () => orgIds.length > 0 ? pick(orgIds) : undefined;

    const numBorrowers = randInt(14, 22);
    const borrowerValues: any[] = [];

    for (let i = 0; i < numBorrowers; i++) {
      const isIndividual = Math.random() < 0.8;
      if (isIndividual) {
        const firstName = pick(country.firstNames);
        const lastName = pick(country.lastNames);
        const gender = ["Male", "Female"][randInt(0, 1)];
        const birthYear = randInt(1960, 2000);
        borrowerValues.push({
          type: "individual" as const,
          firstName,
          lastName,
          nationalId: `${country.code}-ID-${randInt(10000, 99999)}`,
          tinNumber: `TIN-${country.code}-${randInt(1000000, 9999999)}`,
          dateOfBirth: `${birthYear}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
          gender,
          phone: `${country.phone}${randInt(100000000, 999999999)}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.com`,
          address: `${randInt(1, 500)} ${pick(country.cities)} Avenue`,
          city: pick(country.cities),
          country: country.name,
          employerName: pick([...country.banks, ...country.companies]),
          occupation: pick(["Engineer", "Manager", "Analyst", "Teacher", "Doctor", "Trader", "Farmer", "Officer", "Accountant", "Developer"]),
          sector: pick(SECTORS),
          organizationId: assignOrg(),
        });
      } else {
        const company = pick(country.companies) + (Math.random() > 0.5 ? "" : ` ${pick(country.cities)}`);
        borrowerValues.push({
          type: "corporate" as const,
          companyName: company,
          nationalId: `${country.code}-BIZ-${randInt(10000, 99999)}`,
          tinNumber: `TIN-${country.code}-C-${randInt(1000000, 9999999)}`,
          phone: `${country.phone}${randInt(100000000, 999999999)}`,
          email: `info@${slugify(company)}.com`,
          address: `${pick(country.cities)} Industrial Area`,
          city: pick(country.cities),
          country: country.name,
          businessRegNumber: `BR-${country.code}-${randInt(2005, 2024)}-${randInt(1000, 9999)}`,
          sector: pick(SECTORS),
          organizationId: assignOrg(),
        });
      }
    }

    const createdBorrowers = await db.insert(borrowers).values(borrowerValues).returning();
    totalBorrowers += createdBorrowers.length;

    const accountValues: any[] = [];
    for (const b of createdBorrowers) {
      const numAccounts = randInt(1, 3);
      for (let a = 0; a < numAccounts; a++) {
        const original = parseFloat(randDec(1000, 500000));
        const balRatio = 0.1 + Math.random() * 0.9;
        const status = pick(STATUSES);
        accountValues.push({
          borrowerId: b.id,
          lenderInstitution: pick(country.banks),
          accountNumber: `${country.code}-LN-${randInt(2020, 2025)}-${randInt(1000, 9999)}`,
          accountType: pick(LOAN_TYPES),
          originalAmount: original.toFixed(2),
          currentBalance: (status === "closed" ? 0 : original * balRatio).toFixed(2),
          currency: country.currency,
          interestRate: randDec(5, 35),
          disbursementDate: `${randInt(2020, 2025)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
          maturityDate: `${randInt(2026, 2032)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
          status,
          daysInArrears: status === "delinquent" ? randInt(15, 90) : status === "default" ? randInt(91, 365) : 0,
          collateralType: Math.random() > 0.3 ? pick(COLLATERAL_TYPES) : undefined,
          collateralValue: Math.random() > 0.3 ? randDec(2000, 1000000) : undefined,
          lastPaymentDate: status !== "closed" ? `2026-${String(randInt(1, 3)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}` : undefined,
          lastPaymentAmount: status !== "closed" ? randDec(100, 20000) : undefined,
          organizationId: assignOrg(),
        });
      }
    }

    for (let i = 0; i < accountValues.length; i += BATCH) {
      await db.insert(creditAccounts).values(accountValues.slice(i, i + BATCH));
    }
    totalAccounts += accountValues.length;

    const inquirySample = createdBorrowers.slice(0, Math.min(5, createdBorrowers.length));
    const inquiryValues: any[] = [];
    for (const b of inquirySample) {
      inquiryValues.push({
        borrowerId: b.id,
        inquiredBy: adminUser.id,
        purpose: pick(["new_credit", "review", "collection", "regulatory", "portfolio_monitoring"] as const),
        institution: pick(country.banks),
        consentProvided: Math.random() > 0.05,
      });
    }
    if (inquiryValues.length > 0) {
      await db.insert(creditInquiries).values(inquiryValues);
      totalInquiries += inquiryValues.length;
    }

    process.stdout.write(`  ${country.name} (${createdBorrowers.length} borrowers, ${accountValues.length} accounts)\n`);
  }

  await db.insert(auditLogs).values([
    { userId: adminUser.id, action: "LOGIN", entity: "system", details: "Pan-African data initialization completed", ipAddress: "127.0.0.1" },
    { userId: adminUser.id, action: "CREATE", entity: "system", details: `Seeded ${totalBorrowers} borrowers across ${AFRICAN_COUNTRIES.length} African countries`, ipAddress: "127.0.0.1" },
    { userId: adminUser.id, action: "CREATE", entity: "organization", details: `Created ${totalOrgs} financial institutions across Africa`, ipAddress: "127.0.0.1" },
  ]);

  console.log(`\nPan-African seed complete:`);
  console.log(`  Organizations: ${totalOrgs}`);
  console.log(`  Borrowers: ${totalBorrowers}`);
  console.log(`  Credit Accounts: ${totalAccounts}`);
  console.log(`  Credit Inquiries: ${totalInquiries}`);
}

if (process.argv[1] && (process.argv[1].endsWith("seed-pan-african.ts") || process.argv[1].endsWith("seed-pan-african.js"))) {
  seedPanAfrican()
    .then(() => { console.log("Pan-African seed complete"); process.exit(0); })
    .catch((e) => { console.error("Pan-African seed failed:", e); process.exit(1); });
}
