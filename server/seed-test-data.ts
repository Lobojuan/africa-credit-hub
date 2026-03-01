import { db } from "./db";
import { borrowers, creditAccounts, courtJudgments, consentRecords, paymentHistory, institutions, billingRecords, disputes, users } from "@shared/schema";
import { count, like, eq } from "drizzle-orm";

const countryData: Record<string, {
  currency: string; idPrefix: string;
  cities: string[]; regions: string[];
  banks: string[]; phones: string;
  firstNames: string[]; lastNames: string[];
  companies: string[];
  courts: string[];
}> = {
  Algeria: {
    currency: "DZD", idPrefix: "DZA",
    cities: ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", "Tlemcen"],
    regions: ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", "Tlemcen"],
    banks: ["BNA Algeria", "CPA Bank", "BEA Bank", "Société Générale Algérie", "Gulf Bank Algeria"],
    phones: "+213",
    firstNames: ["Mohamed", "Fatima", "Ahmed", "Amina", "Youssef", "Khadija", "Omar", "Meriem", "Karim", "Samira", "Rachid", "Nadia"],
    lastNames: ["Boudiaf", "Benmohamed", "Hadj", "Benali", "Medjdoub", "Saidi", "Hamidi", "Zeroual", "Toumi", "Khelifi"],
    companies: ["Sonatrach Trading", "Cevital Group", "Algérie Telecom Services", "ENIE Electronics", "Air Algérie Cargo", "Saidal Pharmaceuticals"],
    courts: ["Supreme Court of Algeria", "Court of Algiers", "Commercial Court Oran", "Tribunal of Constantine"],
  },
  Angola: {
    currency: "AOA", idPrefix: "AGO",
    cities: ["Luanda", "Huambo", "Lobito", "Benguela", "Lubango", "Malanje", "Namibe", "Cabinda"],
    regions: ["Luanda", "Huambo", "Benguela", "Huíla", "Malanje", "Namibe", "Cabinda", "Lunda Norte"],
    banks: ["BFA Angola", "BAI Bank", "BIC Angola", "Standard Bank Angola", "Banco Sol"],
    phones: "+244",
    firstNames: ["João", "Maria", "Pedro", "Ana", "António", "Luísa", "Francisco", "Rosa", "Manuel", "Catarina", "Carlos", "Teresa"],
    lastNames: ["Santos", "Silva", "Ferreira", "Costa", "Pereira", "Rodrigues", "Martins", "Neto", "Gomes", "Mendes"],
    companies: ["Sonangol Trading", "TAAG Airlines Services", "Unitel Communications", "Refriango Beverages", "Nocal Brewing", "Kero Supermarkets"],
    courts: ["Supreme Court of Angola", "Provincial Court Luanda", "Commercial Court Benguela", "Tribunal of Huambo"],
  },
  Benin: {
    currency: "XOF", idPrefix: "BEN",
    cities: ["Cotonou", "Porto-Novo", "Parakou", "Djougou", "Abomey", "Bohicon", "Kandi", "Natitingou"],
    regions: ["Atlantique", "Ouémé", "Borgou", "Donga", "Zou", "Collines", "Alibori", "Atacora"],
    banks: ["Bank of Africa Benin", "Ecobank Benin", "BIBE Bank", "UBA Benin", "BGFI Benin"],
    phones: "+229",
    firstNames: ["Kossi", "Adjovi", "Codjo", "Afi", "Dossou", "Akouavi", "Agossou", "Ayélé", "Sessinou", "Gbètoho", "Togbe", "Mawulé"],
    lastNames: ["Agbodjan", "Houngbédji", "Sossou", "Dossou", "Alassane", "Hountondjia", "Azonhoumon", "Gbaguidi", "Akpata", "Topanou"],
    companies: ["Cotonou Port Services", "Bénin Télécom", "SHB Hotels", "SOBEMAP Logistics", "Trans-Bénin", "Bénin Agri-Export"],
    courts: ["Supreme Court of Benin", "Court of Appeal Cotonou", "Commercial Court Porto-Novo", "Tribunal of Parakou"],
  },
  Botswana: {
    currency: "BWP", idPrefix: "BWA",
    cities: ["Gaborone", "Francistown", "Maun", "Selebi-Phikwe", "Serowe", "Kasane", "Lobatse", "Palapye"],
    regions: ["South-East", "North-East", "North-West", "Central", "Kgalagadi", "Kweneng", "Chobe", "Southern"],
    banks: ["First National Bank Botswana", "Barclays Botswana", "Standard Chartered Botswana", "Stanbic Bank Botswana", "Bank of Botswana"],
    phones: "+267",
    firstNames: ["Thabo", "Kefilwe", "Tebogo", "Mpho", "Kagiso", "Naledi", "Kgosi", "Lesego", "Onkabetse", "Boitumelo", "Motheo", "Dineo"],
    lastNames: ["Moeti", "Molefe", "Kgositsile", "Modise", "Mogotsi", "Kebonang", "Ramotswe", "Seretse", "Masire", "Khama"],
    companies: ["Debswana Diamond Co.", "Botswana Meat Commission", "BTC Telecom", "Choppies Enterprises", "Letshego Holdings", "Sechaba Brewery"],
    courts: ["High Court of Botswana", "Industrial Court Gaborone", "Customary Court Francistown", "Magistrate Court Maun"],
  },
  "Burkina Faso": {
    currency: "XOF", idPrefix: "BFA",
    cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Kaya", "Tenkodogo", "Fada N'Gourma"],
    regions: ["Centre", "Hauts-Bassins", "Centre-Ouest", "Cascades", "Nord", "Centre-Nord", "Centre-Est", "Est"],
    banks: ["BICIA-B", "Ecobank Burkina", "Coris Bank", "UBA Burkina", "Bank of Africa Burkina"],
    phones: "+226",
    firstNames: ["Ousmane", "Mariam", "Hamidou", "Fatoumata", "Adama", "Aminata", "Boureima", "Kadiatou", "Moussa", "Awa", "Ibrahim", "Salamata"],
    lastNames: ["Ouédraogo", "Compaoré", "Sawadogo", "Kaboré", "Diallo", "Traoré", "Sanogo", "Zoungrana", "Kientéga", "Sié"],
    companies: ["SONABEL Power", "Burkina Mining Corp", "Fasotex Textiles", "Ouaga Telecom", "Sahel Agribusiness", "BRAKINA Brewery"],
    courts: ["Supreme Court of Burkina Faso", "Court of Ouagadougou", "Commercial Court Bobo-Dioulasso", "Tribunal of Koudougou"],
  },
  Burundi: {
    currency: "BIF", idPrefix: "BDI",
    cities: ["Bujumbura", "Gitega", "Ngozi", "Rumonge", "Bururi", "Kayanza", "Muyinga", "Cibitoke"],
    regions: ["Bujumbura Mairie", "Gitega", "Ngozi", "Rumonge", "Bururi", "Kayanza", "Muyinga", "Cibitoke"],
    banks: ["Bancobu", "BCB Burundi", "Interbank Burundi", "KCB Burundi", "Ecobank Burundi"],
    phones: "+257",
    firstNames: ["Jean", "Marie", "Pierre", "Jeanne", "Emmanuel", "Béatrice", "Patrice", "Claudine", "Désiré", "Espérance", "Faustin", "Goretti"],
    lastNames: ["Ndayisaba", "Nkurunziza", "Bizimana", "Hakizimana", "Niyonzima", "Havyarimana", "Ntahompagaze", "Iradukunda", "Baranyanka", "Ngendakumana"],
    companies: ["BRARUDI Brewery", "Burundi Tea Company", "ONATEL Telecom", "Bujumbura Port Services", "Regideso Water", "SOCABU Insurance"],
    courts: ["Supreme Court of Burundi", "Court of Appeal Bujumbura", "Commercial Court Gitega", "Tribunal of Ngozi"],
  },
  "Cabo Verde": {
    currency: "CVE", idPrefix: "CPV",
    cities: ["Praia", "Mindelo", "Santa Maria", "Assomada", "Espargos", "Porto Novo", "São Filipe", "Tarrafal"],
    regions: ["Santiago", "São Vicente", "Sal", "Santa Catarina", "Boa Vista", "Santo Antão", "Fogo", "São Nicolau"],
    banks: ["BCA Bank", "Caixa Económica", "BAI Cabo Verde", "Ecobank Cabo Verde", "BI Bank"],
    phones: "+238",
    firstNames: ["José", "Maria", "António", "Ana", "Carlos", "Fátima", "Jorge", "Isabel", "Paulo", "Rosa", "Fernando", "Helena"],
    lastNames: ["Lopes", "Tavares", "Rodrigues", "Gomes", "Fonseca", "Almeida", "Monteiro", "Barros", "Correia", "Vieira"],
    companies: ["TACV Airlines", "Electra Energy", "CV Telecom", "Cavibel Beverages", "Moave Flour Mills", "Interbase Hotels"],
    courts: ["Supreme Court of Cabo Verde", "Court of Praia", "District Court Mindelo", "Tribunal of Sal"],
  },
  Cameroon: {
    currency: "XAF", idPrefix: "CMR",
    cities: ["Douala", "Yaoundé", "Bamenda", "Bafoussam", "Garoua", "Maroua", "Ngaoundéré", "Bertoua"],
    regions: ["Littoral", "Centre", "North-West", "West", "North", "Far North", "Adamawa", "East"],
    banks: ["Afriland First Bank", "BICEC Bank", "SCB Cameroon", "UBA Cameroon", "Ecobank Cameroon"],
    phones: "+237",
    firstNames: ["Ngone", "Akono", "Mvondo", "Ngo", "Tchatchoua", "Mbassi", "Fotso", "Njie", "Fon", "Mbah", "Kamga", "Oumarou"],
    lastNames: ["Atangana", "Biya", "Fombon", "Kamga", "Mbarga", "Ndi", "Ngono", "Tambe", "Tchinda", "Zang"],
    companies: ["SONARA Refinery", "MTN Cameroon Services", "Douala Port Authority", "CDC Cameroon", "CAMTEL Telecom", "Brasseries du Cameroun"],
    courts: ["Supreme Court of Cameroon", "Court of Appeal Douala", "Commercial Court Yaoundé", "Tribunal of Bamenda"],
  },
  "Central African Republic": {
    currency: "XAF", idPrefix: "CAF",
    cities: ["Bangui", "Bimbo", "Berbérati", "Carnot", "Bambari", "Bouar", "Bossangoa", "Bria"],
    regions: ["Bangui", "Ombella-M'Poko", "Mambéré-Kadéï", "Mambéré-Kadéï", "Ouaka", "Nana-Mambéré", "Ouham", "Haute-Kotto"],
    banks: ["BPMC Bank", "Ecobank CAR", "Commercial Bank CAR", "BSIC CAR", "UBA CAR"],
    phones: "+236",
    firstNames: ["Jean-Pierre", "Solange", "Barthélémy", "Constance", "Sylvain", "Angélique", "Parfait", "Gisèle", "Faustin", "Bernadette", "Dieudonné", "Brigitte"],
    lastNames: ["Boganda", "Bokassa", "Dacko", "Kolingba", "Patassé", "Bozizé", "Touadéra", "Djotodia", "Ziguélé", "Nzapayéké"],
    companies: ["ENERCA Power", "Socatel Telecom", "SODECA Water", "CAR Mining Co.", "Bangui Trading", "Centrafrique Bois"],
    courts: ["Supreme Court of CAR", "Court of Appeal Bangui", "Criminal Court Bangui", "Tribunal of Berbérati"],
  },
  Chad: {
    currency: "XAF", idPrefix: "TCD",
    cities: ["N'Djamena", "Moundou", "Abéché", "Sarh", "Kélo", "Doba", "Am Timan", "Bongor"],
    regions: ["N'Djamena", "Logone Occidental", "Ouaddaï", "Moyen-Chari", "Tandjilé", "Logone Oriental", "Salamat", "Mayo-Kebbi Est"],
    banks: ["BCC Chad", "Ecobank Chad", "UBA Chad", "Société Générale Tchad", "Commercial Bank Tchad"],
    phones: "+235",
    firstNames: ["Mahamat", "Haoua", "Idriss", "Amina", "Ahmat", "Kaltouma", "Deby", "Fatimé", "Oumar", "Zara", "Abakar", "Mariam"],
    lastNames: ["Déby", "Moussa", "Mahamat", "Hassan", "Adam", "Ali", "Ibrahim", "Saleh", "Abakar", "Ousmane"],
    companies: ["SHT Petroleum", "Tigo Chad", "SNE Power", "Cotontchad", "Hotel Kempinski N'Djamena", "STEE Water"],
    courts: ["Supreme Court of Chad", "Court of Appeal N'Djamena", "Commercial Court Moundou", "Tribunal of Abéché"],
  },
  Comoros: {
    currency: "KMF", idPrefix: "COM",
    cities: ["Moroni", "Mutsamudu", "Fomboni", "Domoni", "Mitsoudjé", "Sima", "Ouani", "Ntsoudjini"],
    regions: ["Grande Comore", "Anjouan", "Mohéli", "Moroni", "Mutsamudu", "Fomboni", "Domoni", "Sima"],
    banks: ["BIC Comores", "BFC Bank", "Exim Bank Comores", "BDC Comores", "SNPSF"],
    phones: "+269",
    firstNames: ["Said", "Halima", "Ali", "Moinaecha", "Mohamed", "Zainaba", "Abdou", "Fatima", "Ibrahim", "Amina", "Ahmed", "Mariama"],
    lastNames: ["Abdallah", "Mohamed", "Ahmed", "Ali", "Hassane", "Soilihi", "Bacar", "Mchangama", "Msaidie", "Abdouroihmane"],
    companies: ["Comores Telecom", "SCH Hotels", "MAMWE Power", "Air Comores", "Comoros Fish Export", "Ylang Export Co."],
    courts: ["Supreme Court of Comoros", "Court of Moroni", "Tribunal of Mutsamudu", "Court of Fomboni"],
  },
  Congo: {
    currency: "XAF", idPrefix: "COG",
    cities: ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Ouesso", "Impfondo", "Owando", "Sibiti"],
    regions: ["Brazzaville", "Pointe-Noire", "Niari", "Bouenza", "Sangha", "Likouala", "Cuvette", "Lékoumou"],
    banks: ["BGFI Bank Congo", "Ecobank Congo", "UBA Congo", "LCB Bank", "Société Générale Congo"],
    phones: "+242",
    firstNames: ["Parfait", "Pascaline", "Serge", "Claudine", "Denis", "Alphonsine", "Hervé", "Julienne", "Clément", "Béatrice", "Guy", "Antoinette"],
    lastNames: ["Sassou", "Nguesso", "Lissouba", "Kolelas", "Yhombi", "Mboungou", "Nzoussi", "Bounkoulou", "Mouamba", "Ngouélo"],
    companies: ["SNPC Petroleum", "MTN Congo", "CEC Power", "Port Autonome Pointe-Noire", "Congo Mining", "Brasco Brewery"],
    courts: ["Supreme Court of Congo", "Court of Appeal Brazzaville", "Commercial Court Pointe-Noire", "Tribunal of Dolisie"],
  },
  "DR Congo": {
    currency: "CDF", idPrefix: "COD",
    cities: ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Bukavu", "Goma", "Kananga", "Kolwezi"],
    regions: ["Kinshasa", "Haut-Katanga", "Kasaï-Oriental", "Tshopo", "Sud-Kivu", "Nord-Kivu", "Kasaï-Central", "Lualaba"],
    banks: ["BCDC Bank", "Rawbank", "Equity BCDC", "Trust Merchant Bank", "FBN Bank DRC"],
    phones: "+243",
    firstNames: ["Mobutu", "Kabila", "Tshisekedi", "Malu", "Ilunga", "Ngalula", "Kasongo", "Nsimba", "Mbombo", "Kapinga", "Lukombo", "Binti"],
    lastNames: ["Kabongo", "Mutombo", "Lumumba", "Tshombe", "Kasavubu", "Mobutu", "Wemba", "Kanda", "Mwamba", "Kalala"],
    companies: ["Gécamines Mining", "Vodacom Congo", "SNEL Power", "Brasimba Brewery", "Congo Airways", "SCTP Transport"],
    courts: ["Supreme Court of DRC", "Court of Appeal Kinshasa", "Commercial Court Lubumbashi", "Tribunal of Goma"],
  },
  "Côte d'Ivoire": {
    currency: "XOF", idPrefix: "CIV",
    cities: ["Abidjan", "Bouaké", "Yamoussoukro", "Daloa", "Korhogo", "San-Pédro", "Man", "Gagnoa"],
    regions: ["Lagunes", "Vallée du Bandama", "Lacs", "Haut-Sassandra", "Savanes", "Bas-Sassandra", "Montagnes", "Gôh"],
    banks: ["Société Générale CI", "Ecobank CI", "BIAO CI", "BICICI", "Bridge Bank CI"],
    phones: "+225",
    firstNames: ["Kouadio", "Adjoua", "Konan", "Amenan", "Yao", "Affoue", "Koffi", "Akissi", "Ouattara", "Aya", "Bamba", "Salimata"],
    lastNames: ["Ouattara", "Bédié", "Gbagbo", "Koné", "Coulibaly", "Diabaté", "Touré", "Drogba", "Soro", "Guéhi"],
    companies: ["CIE Power", "Orange CI", "SIR Refinery", "Nestlé CI", "SODECI Water", "Cargill Cocoa CI"],
    courts: ["Supreme Court of Côte d'Ivoire", "Court of Appeal Abidjan", "Commercial Court Bouaké", "Tribunal of Yamoussoukro"],
  },
  Djibouti: {
    currency: "DJF", idPrefix: "DJI",
    cities: ["Djibouti City", "Ali Sabieh", "Tadjoura", "Obock", "Dikhil", "Arta", "Loyada", "Yoboki"],
    regions: ["Djibouti", "Ali Sabieh", "Tadjoura", "Obock", "Dikhil", "Arta", "Loyada", "Yoboki"],
    banks: ["BCI Djibouti", "CAC Bank", "Salaam African Bank", "Bank of Africa Djibouti", "Exim Bank Djibouti"],
    phones: "+253",
    firstNames: ["Hassan", "Kadra", "Moussa", "Amina", "Ismail", "Saada", "Omar", "Hawa", "Ali", "Hodan", "Abdi", "Nimo"],
    lastNames: ["Guled", "Gouled", "Aptidon", "Aden", "Farah", "Elmi", "Dirieh", "Kamil", "Warsama", "Idriss"],
    companies: ["Djibouti Telecom", "PAID Port Authority", "EDD Power", "Djibouti Salt Mining", "Red Sea Hotels", "Djibouti Free Zone"],
    courts: ["Supreme Court of Djibouti", "Court of Appeal Djibouti", "Commercial Court Djibouti", "Tribunal of Ali Sabieh"],
  },
  Egypt: {
    currency: "EGP", idPrefix: "EGY",
    cities: ["Cairo", "Alexandria", "Giza", "Sharm El-Sheikh", "Luxor", "Aswan", "Port Said", "Suez"],
    regions: ["Cairo", "Alexandria", "Giza", "South Sinai", "Luxor", "Aswan", "Port Said", "Suez"],
    banks: ["National Bank of Egypt", "Banque Misr", "CIB Egypt", "QNB Alahli", "HSBC Egypt"],
    phones: "+20",
    firstNames: ["Ahmed", "Fatma", "Mohamed", "Nour", "Mahmoud", "Heba", "Omar", "Salma", "Hassan", "Aya", "Khaled", "Mona"],
    lastNames: ["El-Sayed", "Ibrahim", "Hassan", "Ali", "Mohamed", "Mahmoud", "Abdel-Rahman", "Fathy", "Nasser", "Saad"],
    companies: ["Orascom Construction", "Telecom Egypt", "EgyptAir Services", "El Sewedy Electric", "Edita Food Industries", "Oriental Weavers"],
    courts: ["Supreme Constitutional Court", "Cairo Court of Appeal", "Alexandria Commercial Court", "Economic Court Cairo"],
  },
  "Equatorial Guinea": {
    currency: "XAF", idPrefix: "GNQ",
    cities: ["Malabo", "Bata", "Ebebiyin", "Aconibe", "Añisoc", "Luba", "Mongomo", "Riaba"],
    regions: ["Bioko Norte", "Litoral", "Kie-Ntem", "Centro Sur", "Wele-Nzas", "Bioko Sur", "Mongomo", "Annobón"],
    banks: ["BANGE Bank", "CCEI Bank", "BGFI Bank EG", "Société Générale EG", "Ecobank EG"],
    phones: "+240",
    firstNames: ["Teodoro", "María", "Francisco", "Carmen", "Santiago", "Dolores", "Miguel", "Pilar", "Ángel", "Rosa", "Pedro", "Isabel"],
    lastNames: ["Obiang", "Nguema", "Mbasogo", "Mangue", "Ndong", "Nsue", "Oyono", "Ela", "Mba", "Esono"],
    companies: ["GEPetrol", "SEGESA Power", "GETESA Telecom", "Malabo Hotels", "EG LNG", "Ceiba Intercontinental"],
    courts: ["Supreme Court of EG", "Court of Appeal Malabo", "Commercial Court Bata", "Tribunal of Ebebiyin"],
  },
  Eritrea: {
    currency: "ERN", idPrefix: "ERI",
    cities: ["Asmara", "Keren", "Massawa", "Assab", "Mendefera", "Adi Keyh", "Barentu", "Tessenei"],
    regions: ["Maekel", "Anseba", "Northern Red Sea", "Southern Red Sea", "Debub", "Debub", "Gash-Barka", "Gash-Barka"],
    banks: ["Bank of Eritrea", "Commercial Bank of Eritrea", "Housing & Commerce Bank", "Eritrean Investment Bank", "Development Bank Eritrea"],
    phones: "+291",
    firstNames: ["Berhane", "Letemariam", "Dawit", "Semhar", "Yonas", "Elsa", "Medhanie", "Freweini", "Amanuel", "Rigat", "Kidane", "Senait"],
    lastNames: ["Haile", "Gebremichael", "Tesfamariam", "Weldemichael", "Ghebremedhin", "Tekle", "Berhe", "Desta", "Hagos", "Tesfay"],
    companies: ["Eritrean Airlines", "EriTel Telecom", "Red Sea Trading", "Asmara Brewery", "Bisha Mining", "EEA Power"],
    courts: ["High Court of Eritrea", "Court of Asmara", "Regional Court Keren", "Tribunal of Massawa"],
  },
  Eswatini: {
    currency: "SZL", idPrefix: "SWZ",
    cities: ["Mbabane", "Manzini", "Siteki", "Piggs Peak", "Nhlangano", "Big Bend", "Simunye", "Lavumisa"],
    regions: ["Hhohho", "Manzini", "Lubombo", "Hhohho", "Shiselweni", "Lubombo", "Lubombo", "Shiselweni"],
    banks: ["Standard Bank Eswatini", "FNB Eswatini", "Nedbank Eswatini", "Eswatini Bank", "Eswatini Development Bank"],
    phones: "+268",
    firstNames: ["Sipho", "Nomcebo", "Thulani", "Nonhlanhla", "Bongani", "Zanele", "Mandla", "Lindiwe", "Sibusiso", "Ntombi", "Mduduzi", "Busisiwe"],
    lastNames: ["Dlamini", "Nkosi", "Mamba", "Simelane", "Maseko", "Tsabedze", "Hlophe", "Fakudze", "Kunene", "Zwane"],
    companies: ["Eswatini Sugar", "MTN Eswatini", "Eswatini Electricity", "Royal Swazi Spa", "Eswatini Posts", "Ubombo Sugar"],
    courts: ["Supreme Court of Eswatini", "High Court Mbabane", "Industrial Court Manzini", "Magistrate Court Siteki"],
  },
  Ethiopia: {
    currency: "ETB", idPrefix: "ETH",
    cities: ["Addis Ababa", "Dire Dawa", "Hawassa", "Bahir Dar", "Jimma", "Mekelle", "Adama", "Gondar"],
    regions: ["Addis Ababa", "Oromia", "Amhara", "SNNPR", "Tigray", "Dire Dawa", "Sidama", "Harari"],
    banks: ["Commercial Bank of Ethiopia", "Dashen Bank", "Awash International Bank", "Bank of Abyssinia", "Nib International Bank"],
    phones: "+251",
    firstNames: ["Tsegaye", "Birtukan", "Dereje", "Meseret", "Tadesse", "Hiwot", "Fikru", "Seble", "Berhanu", "Tigist", "Dawit", "Alem", "Getachew", "Mulu"],
    lastNames: ["Haile", "Alemu", "Wolde", "Tesfaye", "Gebremedhin", "Dagne", "Admasu", "Mulugeta", "Assefa", "Teshome", "Girma", "Mekonnen"],
    companies: ["Addis Industrial Group S.C.", "Hawassa Agro-Processing PLC", "Dire Dawa Trading S.C.", "Blue Nile Cement PLC", "Bahir Dar Textiles S.C.", "Jimma Coffee Export PLC"],
    courts: ["Federal High Court Addis Ababa", "Oromia Regional Court", "Federal Supreme Court", "Commercial Bench Addis Ababa"],
  },
  Gabon: {
    currency: "XAF", idPrefix: "GAB",
    cities: ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda", "Mouila", "Lambaréné", "Tchibanga"],
    regions: ["Estuaire", "Ogooué-Maritime", "Haut-Ogooué", "Woleu-Ntem", "Haut-Ogooué", "Ngounié", "Moyen-Ogooué", "Nyanga"],
    banks: ["BGFI Bank Gabon", "UGB Bank", "Ecobank Gabon", "BICIG Bank", "Société Générale Gabon"],
    phones: "+241",
    firstNames: ["Jean-Rémy", "Pascaline", "Ali", "Odette", "Omar", "Angélique", "Hervé", "Célestine", "Patrick", "Sylvie", "Eric", "Marie-Claire"],
    lastNames: ["Bongo", "Ondimba", "Moussavou", "Ntoutoume", "Mba", "Obame", "Nze", "Essonghe", "Ngoubou", "Myboto"],
    companies: ["Total Gabon", "Gabon Telecom", "SEEG Power", "COMILOG Mining", "Olam Gabon", "Air Service Gabon"],
    courts: ["Supreme Court of Gabon", "Court of Appeal Libreville", "Commercial Court Port-Gentil", "Tribunal of Franceville"],
  },
  Gambia: {
    currency: "GMD", idPrefix: "GMB",
    cities: ["Banjul", "Serekunda", "Brikama", "Bakau", "Farafenni", "Lamin", "Soma", "Basse Santa Su"],
    regions: ["Banjul", "Kanifing", "West Coast", "Banjul", "North Bank", "Western", "Lower River", "Upper River"],
    banks: ["Standard Chartered Gambia", "Trust Bank Gambia", "Ecobank Gambia", "GTBank Gambia", "Reliance Financial Services"],
    phones: "+220",
    firstNames: ["Adama", "Isatou", "Lamin", "Fatou", "Ousman", "Aminata", "Ebrima", "Binta", "Modou", "Mariama", "Musa", "Ndey"],
    lastNames: ["Barrow", "Jammeh", "Jallow", "Ceesay", "Camara", "Touray", "Dibba", "Bojang", "Manneh", "Sanneh"],
    companies: ["Gamcel Telecom", "NAWEC Power", "Gambia Ports Authority", "GGC Groundnut", "Gambia River Transport", "Senegambia Hotels"],
    courts: ["Supreme Court of Gambia", "High Court Banjul", "Magistrate Court Serekunda", "Tribunal of Brikama"],
  },
  Ghana: {
    currency: "GHS", idPrefix: "GHA",
    cities: ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Sunyani", "Ho", "Koforidua"],
    regions: ["Greater Accra", "Ashanti", "Northern", "Western", "Central", "Bono", "Volta", "Eastern"],
    banks: ["GCB Bank", "Ecobank Ghana", "Fidelity Bank Ghana", "CalBank", "Stanbic Bank Ghana"],
    phones: "+233",
    firstNames: ["Kwame", "Ama", "Kofi", "Akua", "Kwesi", "Abena", "Yaw", "Efua", "Kojo", "Adwoa", "Nana", "Afia", "Kwaku", "Adjoa"],
    lastNames: ["Mensah", "Asante", "Boateng", "Osei", "Annan", "Agyeman", "Appiah", "Frimpong", "Darko", "Addai", "Owusu", "Acheampong"],
    companies: ["Kumasi Breweries Ltd", "Accra Textiles S.A.", "Gold Coast Logistics Ltd", "Ashanti Agribusiness Co.", "Volta River Foods Ltd", "Cape Coast Fishing Co."],
    courts: ["High Court of Accra", "Circuit Court Kumasi", "Supreme Court of Ghana", "Commercial Division Accra"],
  },
  Guinea: {
    currency: "GNF", idPrefix: "GIN",
    cities: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé", "Mamou", "Boké", "Faranah"],
    regions: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé", "Mamou", "Boké", "Faranah"],
    banks: ["BPMG Guinea", "Ecobank Guinea", "BICIGUI Bank", "Société Générale Guinea", "UBA Guinea"],
    phones: "+224",
    firstNames: ["Mamadou", "Mariama", "Alpha", "Fatoumata", "Ibrahima", "Kadiatou", "Ousmane", "Aissatou", "Sékou", "Djénabou", "Cellou", "Hawa"],
    lastNames: ["Diallo", "Barry", "Bah", "Condé", "Camara", "Soumah", "Sylla", "Touré", "Keita", "Bangoura"],
    companies: ["CBG Mining", "EDG Power", "Orange Guinea", "Guinea Alumina Corp", "Port de Conakry", "Sotelgui Telecom"],
    courts: ["Supreme Court of Guinea", "Court of Appeal Conakry", "Commercial Court Kankan", "Tribunal of Nzérékoré"],
  },
  "Guinea-Bissau": {
    currency: "XOF", idPrefix: "GNB",
    cities: ["Bissau", "Bafatá", "Gabú", "Bissorã", "Bolama", "Cacheu", "Catió", "Farim"],
    regions: ["Bissau", "Bafatá", "Gabú", "Oio", "Bolama", "Cacheu", "Tombali", "Oio"],
    banks: ["BAO Bank", "Ecobank Guinea-Bissau", "BDU Bank", "Banco da África Ocidental", "BGFI Guinea-Bissau"],
    phones: "+245",
    firstNames: ["Domingos", "Francisca", "Aristides", "Odete", "Raimundo", "Lucrécia", "Nino", "Maria", "Kumba", "Braima", "Samba", "Cadija"],
    lastNames: ["Vieira", "Pereira", "Sanhá", "Cabral", "Gomes", "Nhamadjo", "Imbali", "Indjai", "Correia", "Na Tchuto"],
    companies: ["EAGB Power", "Guinea Telecom", "Port of Bissau", "Cashew Export GB", "GB Airlines", "Bissau Hotels"],
    courts: ["Supreme Court of Guinea-Bissau", "Regional Court Bissau", "Court of Bafatá", "Tribunal of Gabú"],
  },
  Kenya: {
    currency: "KES", idPrefix: "KEN",
    cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Machakos"],
    regions: ["Nairobi", "Coast", "Nyanza", "Rift Valley", "Rift Valley", "Central", "Coast", "Eastern"],
    banks: ["KCB Bank", "Equity Bank", "Co-operative Bank", "Standard Chartered Kenya", "NCBA Bank"],
    phones: "+254",
    firstNames: ["Wanjiku", "Kamau", "Otieno", "Akinyi", "Mwangi", "Wambui", "Odhiambo", "Njeri", "Kipchoge", "Chebet", "Mutua", "Njoki"],
    lastNames: ["Kenyatta", "Odinga", "Ruto", "Moi", "Kibaki", "Ngugi", "Wainaina", "Kosgei", "Ochieng", "Musyoka"],
    companies: ["Safaricom PLC", "Kenya Airways", "KenGen Power", "East African Breweries", "KPLC Power", "Bamburi Cement"],
    courts: ["Supreme Court of Kenya", "High Court Nairobi", "Commercial Court Mombasa", "Employment Court Kisumu"],
  },
  Lesotho: {
    currency: "LSL", idPrefix: "LSO",
    cities: ["Maseru", "Teyateyaneng", "Mafeteng", "Hlotse", "Mohale's Hoek", "Quthing", "Qacha's Nek", "Butha-Buthe"],
    regions: ["Maseru", "Berea", "Mafeteng", "Leribe", "Mohale's Hoek", "Quthing", "Qacha's Nek", "Butha-Buthe"],
    banks: ["Standard Lesotho Bank", "FNB Lesotho", "Nedbank Lesotho", "Lesotho PostBank", "Boliba Savings"],
    phones: "+266",
    firstNames: ["Thabo", "Malefu", "Motlatsi", "Nthabiseng", "Retselisitsoe", "Palesa", "Lehlohonolo", "Mamello", "Teboho", "Mpho", "Tshepo", "Lineo"],
    lastNames: ["Moshoeshoe", "Letsie", "Mokhehle", "Thabane", "Majoro", "Matekane", "Ramaema", "Jonathan", "Lekhanya", "Sekhonya"],
    companies: ["LHDA Water", "Vodacom Lesotho", "WASCO Water", "Lesotho Flour Mills", "Maluti Mountain Brewery", "LEC Power"],
    courts: ["Court of Appeal Lesotho", "High Court Maseru", "Magistrate Court Teyateyaneng", "Labour Court Maseru"],
  },
  Liberia: {
    currency: "LRD", idPrefix: "LBR",
    cities: ["Monrovia", "Buchanan", "Gbarnga", "Kakata", "Harper", "Greenville", "Voinjama", "Robertsport"],
    regions: ["Montserrado", "Grand Bassa", "Bong", "Margibi", "Maryland", "Sinoe", "Lofa", "Grand Cape Mount"],
    banks: ["LBDI", "Ecobank Liberia", "GT Bank Liberia", "Access Bank Liberia", "United Bank for Africa Liberia"],
    phones: "+231",
    firstNames: ["Emmanuel", "Comfort", "Joseph", "Lorpu", "Charles", "Mardea", "James", "Tenneh", "George", "Hawa", "Samuel", "Fatu"],
    lastNames: ["Johnson", "Weah", "Sirleaf", "Kollie", "Konneh", "Barkue", "Flomo", "Gaye", "Dennis", "Nimely", "Boakai", "Taylor"],
    companies: ["Monrovia Trade Hub Inc.", "Buchanan Timber Exports LLC", "Roberts International Logistics", "Harper Marine Services Co.", "Greenville Rubber Industries", "Kakata Palm Oil Processors"],
    courts: ["Circuit Court Montserrado", "Supreme Court of Liberia", "Commercial Court Monrovia", "Debt Court Monrovia"],
  },
  Libya: {
    currency: "LYD", idPrefix: "LBY",
    cities: ["Tripoli", "Benghazi", "Misrata", "Sabha", "Zawiya", "Zliten", "Ajdabiya", "Gharyan"],
    regions: ["Tripoli", "Benghazi", "Misrata", "Sabha", "Zawiya", "Zliten", "Ajdabiya", "Jabal al Gharbi"],
    banks: ["Central Bank of Libya", "National Commercial Bank", "Jumhouria Bank", "Wahda Bank", "Sahara Bank"],
    phones: "+218",
    firstNames: ["Omar", "Salma", "Khalid", "Fatima", "Tariq", "Aisha", "Yusuf", "Khadija", "Nouri", "Mariam", "Idris", "Huda"],
    lastNames: ["Gaddafi", "Al-Serraj", "Haftar", "Al-Thani", "Jibril", "El-Keib", "Zeidan", "Al-Hassi", "Dbeibeh", "Bashagha"],
    companies: ["NOC Libya", "Libyana Mobile", "GECOL Power", "Libyan Airlines", "Mellitah Oil & Gas", "Ras Lanuf Refinery"],
    courts: ["Supreme Court of Libya", "Court of Appeal Tripoli", "Commercial Court Benghazi", "Tribunal of Misrata"],
  },
  Madagascar: {
    currency: "MGA", idPrefix: "MDG",
    cities: ["Antananarivo", "Toamasina", "Antsirabe", "Mahajanga", "Fianarantsoa", "Toliara", "Antsiranana", "Ambanja"],
    regions: ["Analamanga", "Atsinanana", "Vakinankaratra", "Boeny", "Haute Matsiatra", "Atsimo-Andrefana", "Diana", "Diana"],
    banks: ["BNI Madagascar", "BOA Madagascar", "BFV-SG Madagascar", "BMOI Bank", "Access Banque Madagascar"],
    phones: "+261",
    firstNames: ["Andry", "Voahirana", "Hery", "Lalao", "Rivo", "Fara", "Tojo", "Hasina", "Narindra", "Mamy", "Fenohasina", "Ravaka"],
    lastNames: ["Rajoelina", "Ravalomanana", "Rajaonarimampianina", "Ratsiraka", "Zafy", "Rabemananjara", "Razafimahaleo", "Rakotonirina", "Andrianampoinimerina", "Ravony"],
    companies: ["Telma Madagascar", "Jirama Power", "Star Beer Madagascar", "Air Madagascar", "Ambatovy Mining", "Galana Petroleum"],
    courts: ["Supreme Court of Madagascar", "Court of Appeal Antananarivo", "Commercial Court Toamasina", "Tribunal of Antsirabe"],
  },
  Malawi: {
    currency: "MWK", idPrefix: "MWI",
    cities: ["Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Kasungu", "Mangochi", "Karonga", "Salima"],
    regions: ["Central", "Southern", "Northern", "Southern", "Central", "Southern", "Northern", "Central"],
    banks: ["National Bank of Malawi", "Standard Bank Malawi", "FDH Bank", "NBS Bank", "CDH Investment Bank"],
    phones: "+265",
    firstNames: ["Lazarus", "Joyce", "Bingu", "Patricia", "Peter", "Mary", "Arthur", "Grace", "Bakili", "Rose", "Hastings", "Catherine"],
    lastNames: ["Chakwera", "Banda", "Mutharika", "Muluzi", "Chilima", "Chipembere", "Chihana", "Msowoya", "Gondwe", "Nkhoma"],
    companies: ["Press Corporation", "TNM Telecom", "ESCOM Power", "Illovo Sugar Malawi", "Carlsberg Malawi", "National Oil Company"],
    courts: ["Supreme Court of Malawi", "High Court Lilongwe", "Commercial Court Blantyre", "Industrial Court Zomba"],
  },
  Mali: {
    currency: "XOF", idPrefix: "MLI",
    cities: ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes", "Koutiala", "Gao", "Timbuktu"],
    regions: ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes", "Sikasso", "Gao", "Timbuktu"],
    banks: ["BDM Bank", "BNDA Mali", "Ecobank Mali", "BOA Mali", "BIM Mali"],
    phones: "+223",
    firstNames: ["Moussa", "Aminata", "Modibo", "Fatoumata", "Ibrahim", "Oumou", "Seydou", "Mariam", "Amadou", "Kadiatou", "Oumar", "Rokia"],
    lastNames: ["Keita", "Traoré", "Touré", "Coulibaly", "Diarra", "Konaté", "Cissé", "Sissoko", "Sidibé", "Sangaré"],
    companies: ["EDM Power", "Orange Mali", "SOTELMA Telecom", "CMDT Cotton", "Bamako Hotel", "Mali Mining Corp"],
    courts: ["Supreme Court of Mali", "Court of Appeal Bamako", "Commercial Court Sikasso", "Tribunal of Mopti"],
  },
  Mauritania: {
    currency: "MRU", idPrefix: "MRT",
    cities: ["Nouakchott", "Nouadhibou", "Kiffa", "Kaédi", "Zouérat", "Rosso", "Atar", "Aleg"],
    regions: ["Nouakchott", "Dakhlet Nouadhibou", "Assaba", "Gorgol", "Tiris Zemmour", "Trarza", "Adrar", "Brakna"],
    banks: ["BNM Bank", "Chinguetti Bank", "Société Générale Mauritanie", "BCI Mauritanie", "Banque Populaire Mauritanie"],
    phones: "+222",
    firstNames: ["Mohamed", "Mariem", "Ahmed", "Fatimetou", "Sidi", "Mounina", "Ely", "Vatma", "Cheikh", "Aissata", "Oumar", "Khadijetou"],
    lastNames: ["Ould Abdel Aziz", "Ould Ghazouani", "Mint Moulaye", "Ould Daddah", "Ould Taya", "Ould Boubacar", "Ould Haidalla", "Mint Ahmed", "Ould Cheikh", "Ould Mohamed"],
    companies: ["SNIM Mining", "Mauritel Telecom", "SOMELEC Power", "Mauritania Airlines", "IMAPEC Fish", "ATTM Transport"],
    courts: ["Supreme Court of Mauritania", "Court of Appeal Nouakchott", "Commercial Court Nouadhibou", "Tribunal of Kiffa"],
  },
  Mauritius: {
    currency: "MUR", idPrefix: "MUS",
    cities: ["Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Curepipe", "Quatre Bornes", "Triolet", "Goodlands", "Mahébourg"],
    regions: ["Port Louis", "Plaines Wilhems", "Plaines Wilhems", "Plaines Wilhems", "Plaines Wilhems", "Pamplemousses", "Rivière du Rempart", "Grand Port"],
    banks: ["MCB Bank", "State Bank of Mauritius", "HSBC Mauritius", "Barclays Mauritius", "AfrAsia Bank"],
    phones: "+230",
    firstNames: ["Pravind", "Ameenah", "Navin", "Maya", "Anerood", "Sarita", "Sushil", "Veena", "Rishi", "Leela", "Raj", "Priya"],
    lastNames: ["Jugnauth", "Ramgoolam", "Berenger", "Duval", "Lutchmeenaraidoo", "Boolell", "Seetanah", "Gujadhur", "Peeroo", "Bundhoo"],
    companies: ["Air Mauritius", "Mauritius Telecom", "CEB Power", "IBL Group", "Rogers Group", "Omnicane Sugar"],
    courts: ["Supreme Court of Mauritius", "Intermediate Court Port Louis", "Commercial Court Mauritius", "Industrial Court Mauritius"],
  },
  Morocco: {
    currency: "MAD", idPrefix: "MAR",
    cities: ["Casablanca", "Rabat", "Marrakech", "Fez", "Tangier", "Agadir", "Meknes", "Oujda"],
    regions: ["Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Fès-Meknès", "Tanger-Tétouan-Al Hoceïma", "Souss-Massa", "Fès-Meknès", "Oriental"],
    banks: ["Attijariwafa Bank", "BMCE Bank", "Banque Populaire", "CIH Bank", "Crédit du Maroc"],
    phones: "+212",
    firstNames: ["Youssef", "Fatima-Zahra", "Mohamed", "Khadija", "Omar", "Salma", "Hassan", "Zineb", "Mehdi", "Nour", "Amine", "Imane"],
    lastNames: ["Benkirane", "El Othmani", "Akhannouch", "El Fassi", "Jettou", "Youssoufi", "Filali", "Basri", "Lahlou", "Benmoussa"],
    companies: ["OCP Group", "Maroc Telecom", "ONE Power", "Royal Air Maroc", "Renault Morocco", "Cosumar Sugar"],
    courts: ["Supreme Court of Morocco", "Court of Appeal Casablanca", "Commercial Court Rabat", "Tribunal of Marrakech"],
  },
  Mozambique: {
    currency: "MZN", idPrefix: "MOZ",
    cities: ["Maputo", "Beira", "Nampula", "Quelimane", "Chimoio", "Tete", "Nacala", "Lichinga"],
    regions: ["Maputo", "Sofala", "Nampula", "Zambezia", "Manica", "Tete", "Nampula", "Niassa"],
    banks: ["BCI Mozambique", "Standard Bank Mozambique", "Millennium BIM", "FNB Mozambique", "Absa Mozambique"],
    phones: "+258",
    firstNames: ["Filipe", "Josina", "Armando", "Graça", "Samora", "Luísa", "Joaquim", "Maria", "Alberto", "Celina", "Eduardo", "Ana"],
    lastNames: ["Nyusi", "Machel", "Guebuza", "Chissano", "Mondlane", "Dhlakama", "Simango", "Mocumbi", "Diogo", "Baloi"],
    companies: ["EDM Power", "Mcel Telecom", "CFM Rail", "LAM Airlines", "Mozal Aluminium", "Cervejas de Moçambique"],
    courts: ["Supreme Court of Mozambique", "Provincial Court Maputo", "Commercial Court Beira", "Tribunal of Nampula"],
  },
  Namibia: {
    currency: "NAD", idPrefix: "NAM",
    cities: ["Windhoek", "Walvis Bay", "Swakopmund", "Oshakati", "Rundu", "Katima Mulilo", "Otjiwarongo", "Keetmanshoop"],
    regions: ["Khomas", "Erongo", "Erongo", "Oshana", "Kavango East", "Zambezi", "Otjozondjupa", "Karas"],
    banks: ["FNB Namibia", "Standard Bank Namibia", "Bank Windhoek", "Nedbank Namibia", "Development Bank Namibia"],
    phones: "+264",
    firstNames: ["Hage", "Saara", "Sam", "Netumbo", "Pohamba", "Pendukeni", "Hifikepunye", "Monica", "Nangolo", "Libertina", "Theo-Ben", "Ndaitwah"],
    lastNames: ["Geingob", "Nujoma", "Pohamba", "Gurirab", "Angula", "Mbumba", "Iivula-Ithana", "Kuugongelwa", "Witbooi", "Garoëb"],
    companies: ["NamPower", "MTC Namibia", "Namdeb Diamond", "TransNamib", "Air Namibia", "Namibia Breweries"],
    courts: ["Supreme Court of Namibia", "High Court Windhoek", "Labour Court Windhoek", "Magistrate Court Walvis Bay"],
  },
  Niger: {
    currency: "XOF", idPrefix: "NER",
    cities: ["Niamey", "Zinder", "Maradi", "Agadez", "Tahoua", "Dosso", "Diffa", "Tillabéri"],
    regions: ["Niamey", "Zinder", "Maradi", "Agadez", "Tahoua", "Dosso", "Diffa", "Tillabéri"],
    banks: ["BIA Niger", "Ecobank Niger", "BOA Niger", "Sonibank", "Banque Agricole du Niger"],
    phones: "+227",
    firstNames: ["Mahamadou", "Aissata", "Issoufou", "Rabi", "Tandja", "Fati", "Mamane", "Hadiza", "Salou", "Mariama", "Hamidou", "Halima"],
    lastNames: ["Issoufou", "Tandja", "Bazoum", "Ousmane", "Diori", "Wanké", "Saïbou", "Kountché", "Mainassara", "Djibo"],
    companies: ["NIGELEC Power", "Niger Telecom", "SONICHAR Mining", "SONIDEP Petroleum", "Air Niger", "Niger Poste"],
    courts: ["Supreme Court of Niger", "Court of Appeal Niamey", "Commercial Court Zinder", "Tribunal of Maradi"],
  },
  Nigeria: {
    currency: "NGN", idPrefix: "NGA",
    cities: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City", "Enugu", "Kaduna"],
    regions: ["Lagos", "FCT", "Kano", "Oyo", "Rivers", "Edo", "Enugu", "Kaduna"],
    banks: ["Access Bank", "Zenith Bank", "GTBank", "First Bank Nigeria", "UBA Nigeria"],
    phones: "+234",
    firstNames: ["Chukwuemeka", "Ngozi", "Babajide", "Funmilayo", "Abdullahi", "Amina", "Oluwaseun", "Chidinma", "Muhammadu", "Fatima", "Emeka", "Adaeze"],
    lastNames: ["Okonkwo", "Adeyemi", "Buhari", "Obi", "Tinubu", "Sanusi", "Adesina", "Dangote", "Otedola", "Elumelu"],
    companies: ["Dangote Group", "MTN Nigeria", "NNPC Petroleum", "Nigerian Breweries", "Access Holdings", "Oando Energy"],
    courts: ["Supreme Court of Nigeria", "Federal High Court Lagos", "Commercial Court Abuja", "High Court Port Harcourt"],
  },
  Rwanda: {
    currency: "RWF", idPrefix: "RWA",
    cities: ["Kigali", "Butare", "Gisenyi", "Ruhengeri", "Cyangugu", "Byumba", "Gitarama", "Kibungo"],
    regions: ["Kigali City", "Southern", "Western", "Northern", "Western", "Northern", "Southern", "Eastern"],
    banks: ["Bank of Kigali", "I&M Bank Rwanda", "KCB Bank Rwanda", "Equity Bank Rwanda", "BPR Atlas Mara"],
    phones: "+250",
    firstNames: ["Jean", "Diane", "Paul", "Jeannette", "Emmanuel", "Marie-Claire", "Patrick", "Claudine", "Vincent", "Josiane", "Charles", "Ange"],
    lastNames: ["Kagame", "Habyarimana", "Bizimungu", "Twagiramungu", "Mushikiwabo", "Mukabalisa", "Nsengimana", "Uwimana", "Ndahiro", "Rugema"],
    companies: ["MTN Rwanda", "RwandAir", "Crystal Ventures", "Bank of Kigali Group", "Bralirwa Brewery", "EWSA Power"],
    courts: ["Supreme Court of Rwanda", "High Court Kigali", "Commercial Court Kigali", "Intermediate Court Butare"],
  },
  "São Tomé and Príncipe": {
    currency: "STN", idPrefix: "STP",
    cities: ["São Tomé", "Santo Amaro", "Neves", "Santana", "Trindade", "Guadalupe", "Angolares", "Pantufo"],
    regions: ["Água Grande", "Lobata", "Mé-Zóchi", "Cantagalo", "Lembá", "Caué", "Príncipe", "Água Grande"],
    banks: ["BISTP Bank", "Afriland First Bank STP", "BGFI STP", "Ecobank STP", "Commercial Bank STP"],
    phones: "+239",
    firstNames: ["Evaristo", "Maria", "Fradique", "Ana", "Manuel", "Teresa", "Patrice", "Graça", "Carlos", "Helena", "Jorge", "Conceição"],
    lastNames: ["Carvalho", "Trovoada", "de Menezes", "Pinto da Costa", "Bragança", "Afonso", "Neto", "Vera Cruz", "Amado", "Daio"],
    companies: ["CST Telecom", "EMAE Power", "STP Airlines", "Agripalma Plantation", "STP Tourism Board", "Porto Alegre Hotels"],
    courts: ["Supreme Court of STP", "District Court São Tomé", "Court of Appeal STP", "Tribunal of Santo Amaro"],
  },
  Senegal: {
    currency: "XOF", idPrefix: "SEN",
    cities: ["Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Touba", "Rufisque", "Mbour"],
    regions: ["Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Diourbel", "Dakar", "Thiès"],
    banks: ["CBAO Bank", "Société Générale Sénégal", "Ecobank Sénégal", "BHS Bank", "BICIS Bank"],
    phones: "+221",
    firstNames: ["Macky", "Aminata", "Abdoulaye", "Marième", "Moustapha", "Sokhna", "Ousmane", "Fatou", "Youssou", "Diouma", "Cheikh", "Coumba"],
    lastNames: ["Sall", "Touré", "Wade", "Diop", "Faye", "Ndiaye", "Thiam", "Ba", "Sy", "Mbaye"],
    companies: ["Sonatel Telecom", "SENELEC Power", "SAR Refinery", "Air Sénégal", "ICS Mining", "Dakar Port Authority"],
    courts: ["Supreme Court of Senegal", "Court of Appeal Dakar", "Commercial Court Thiès", "Tribunal of Saint-Louis"],
  },
  Seychelles: {
    currency: "SCR", idPrefix: "SYC",
    cities: ["Victoria", "Anse Royale", "Beau Vallon", "Anse Boileau", "Takamaka", "Baie Lazare", "Glacis", "Grand Anse"],
    regions: ["Mahé", "Mahé", "Mahé", "Mahé", "Mahé", "Mahé", "Mahé", "Praslin"],
    banks: ["Seychelles Commercial Bank", "Nouvobanq", "Barclays Seychelles", "MCB Seychelles", "Bank of Baroda Seychelles"],
    phones: "+248",
    firstNames: ["Danny", "Sylvette", "James", "Marie-Louise", "Wavel", "Anne", "France-Albert", "Flavien", "Joel", "Jeanne", "Patrick", "Myriam"],
    lastNames: ["Faure", "Michel", "René", "Mancham", "Ramkalawan", "Morgan", "Mancienne", "Pillay", "Jumeau", "Savy"],
    companies: ["Air Seychelles", "Cable & Wireless Seychelles", "PUC Power", "STC Trading", "SEYPEC Petroleum", "Seybrew Brewery"],
    courts: ["Supreme Court of Seychelles", "Court of Appeal Seychelles", "Employment Tribunal Victoria", "Magistrate Court Mahé"],
  },
  "Sierra Leone": {
    currency: "SLE", idPrefix: "SLE",
    cities: ["Freetown", "Bo", "Kenema", "Makeni", "Koidu", "Lunsar", "Port Loko", "Bonthe"],
    regions: ["Western Area", "Southern", "Eastern", "Northern", "Eastern", "Northern", "Northern", "Southern"],
    banks: ["Sierra Leone Commercial Bank", "Rokel Commercial Bank", "Ecobank Sierra Leone", "UBA Sierra Leone", "GT Bank Sierra Leone"],
    phones: "+232",
    firstNames: ["Julius", "Fatmata", "Ernest", "Isata", "Ahmad", "Mariama", "John", "Adama", "Samuel", "Hawa", "Mohamed", "Aminata"],
    lastNames: ["Bio", "Koroma", "Stevens", "Kabbah", "Margai", "Kamara", "Bangura", "Conteh", "Sesay", "Turay"],
    companies: ["SLPMB Marketing", "Sierratel Telecom", "EDSA Power", "Sierra Rutile Mining", "SL Brewery", "Port Authority Freetown"],
    courts: ["Supreme Court of Sierra Leone", "High Court Freetown", "Commercial Court Bo", "Magistrate Court Kenema"],
  },
  Somalia: {
    currency: "SOS", idPrefix: "SOM",
    cities: ["Mogadishu", "Hargeisa", "Kismayo", "Garowe", "Bosaso", "Beledweyne", "Baidoa", "Berbera"],
    regions: ["Banaadir", "Woqooyi Galbeed", "Jubbada Hoose", "Nugaal", "Bari", "Hiiraan", "Bay", "Woqooyi Galbeed"],
    banks: ["Dahabshiil Bank", "Premier Bank", "Salaam Somali Bank", "IBS Bank", "Amal Bank"],
    phones: "+252",
    firstNames: ["Hassan", "Hinda", "Mohamed", "Halimo", "Abdi", "Hodan", "Omar", "Sahra", "Abdullahi", "Fartun", "Yusuf", "Ayan"],
    lastNames: ["Mohamud", "Sheikh", "Farmaajo", "Guled", "Aden", "Ali", "Osman", "Hassan", "Ahmed", "Warsame"],
    companies: ["Hormuud Telecom", "Golis Energy", "Daallo Airlines", "Mogadishu Port", "Berbera Free Zone", "Somali Energy"],
    courts: ["Supreme Court of Somalia", "Appeals Court Mogadishu", "Regional Court Hargeisa", "District Court Kismayo"],
  },
  "South Africa": {
    currency: "ZAR", idPrefix: "ZAF",
    cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Polokwane"],
    regions: ["Gauteng", "Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape", "Free State", "Eastern Cape", "Limpopo"],
    banks: ["Standard Bank SA", "ABSA Bank", "FNB South Africa", "Nedbank", "Capitec Bank"],
    phones: "+27",
    firstNames: ["Sipho", "Nomzamo", "Thabo", "Zanele", "Mandla", "Lindiwe", "Bongani", "Ntombi", "Kagiso", "Naledi", "Tshepo", "Palesa"],
    lastNames: ["Ramaphosa", "Zuma", "Mandela", "Mbeki", "De Klerk", "Sisulu", "Motlanthe", "Nkosazana", "Gordhan", "Mantashe"],
    companies: ["Sasol Ltd", "MTN South Africa", "Eskom Power", "SAB Brewery", "Shoprite Holdings", "Naspers Group"],
    courts: ["Constitutional Court SA", "Supreme Court of Appeal", "High Court Johannesburg", "Labour Court Cape Town"],
  },
  "South Sudan": {
    currency: "SSP", idPrefix: "SSD",
    cities: ["Juba", "Wau", "Malakal", "Bor", "Rumbek", "Aweil", "Bentiu", "Torit"],
    regions: ["Central Equatoria", "Western Bahr el Ghazal", "Upper Nile", "Jonglei", "Lakes", "Northern Bahr el Ghazal", "Unity", "Eastern Equatoria"],
    banks: ["KCB South Sudan", "Equity Bank South Sudan", "Cooperative Bank South Sudan", "Eden Commercial Bank", "Buffalo Commercial Bank"],
    phones: "+211",
    firstNames: ["Salva", "Rebecca", "Riek", "Angelina", "James", "Mary", "Taban", "Grace", "Pagan", "Elizabeth", "Lam", "Awut"],
    lastNames: ["Kiir", "Machar", "Wani", "Garang", "Teny", "Deng", "Igga", "Akol", "Amum", "Mabior"],
    companies: ["Nile Petroleum", "Vivacell Telecom", "SSEC Power", "Juba Port Services", "South Sudan Airlines", "Juba Grand Hotel"],
    courts: ["Supreme Court of South Sudan", "High Court Juba", "Court of Appeal Juba", "County Court Wau"],
  },
  Sudan: {
    currency: "SDG", idPrefix: "SDN",
    cities: ["Khartoum", "Omdurman", "Port Sudan", "Kassala", "El Obeid", "Wad Madani", "Nyala", "El Fasher"],
    regions: ["Khartoum", "Khartoum", "Red Sea", "Kassala", "North Kordofan", "Gezira", "South Darfur", "North Darfur"],
    banks: ["Bank of Khartoum", "Faisal Islamic Bank", "Omdurman National Bank", "Tadamon Islamic Bank", "Sudanese French Bank"],
    phones: "+249",
    firstNames: ["Abdel", "Mariam", "Omar", "Sumaya", "Ibrahim", "Fatima", "Hassan", "Amal", "Ahmed", "Huda", "Mohamed", "Salwa"],
    lastNames: ["Al-Bashir", "Al-Burhan", "Hemeti", "Hamdok", "Al-Mahdi", "Al-Mirghani", "Nimeiri", "Al-Turabi", "Taha", "Sadiq"],
    companies: ["Sudatel Telecom", "Sudan Airways", "Kenana Sugar", "DAL Group", "Giad Motors", "Sudanese Petroleum"],
    courts: ["Supreme Court of Sudan", "Court of Appeal Khartoum", "Commercial Court Omdurman", "Tribunal of Port Sudan"],
  },
  Tanzania: {
    currency: "TZS", idPrefix: "TZA",
    cities: ["Dar es Salaam", "Dodoma", "Mwanza", "Arusha", "Mbeya", "Zanzibar", "Morogoro", "Tanga"],
    regions: ["Dar es Salaam", "Dodoma", "Mwanza", "Arusha", "Mbeya", "Unguja", "Morogoro", "Tanga"],
    banks: ["CRDB Bank", "NMB Bank", "NBC Bank", "Stanbic Bank Tanzania", "Equity Bank Tanzania"],
    phones: "+255",
    firstNames: ["Samia", "Hassan", "John", "Janeth", "Jakaya", "Salma", "Benjamin", "Anna", "Ali", "Fatma", "Edward", "Asha"],
    lastNames: ["Suluhu", "Magufuli", "Kikwete", "Mkapa", "Mwinyi", "Nyerere", "Karume", "Shein", "Lowassa", "Membe"],
    companies: ["Vodacom Tanzania", "TANESCO Power", "TRA Revenue", "Tanzania Breweries", "Air Tanzania", "TPC Sugar"],
    courts: ["Court of Appeal Tanzania", "High Court Dar es Salaam", "Commercial Court Tanzania", "Labour Court Dodoma"],
  },
  Togo: {
    currency: "XOF", idPrefix: "TGO",
    cities: ["Lomé", "Sokodé", "Kara", "Kpalimé", "Atakpamé", "Bassar", "Tsévié", "Aného"],
    regions: ["Maritime", "Centrale", "Kara", "Plateaux", "Plateaux", "Kara", "Maritime", "Maritime"],
    banks: ["Ecobank Togo", "UTB Bank", "BTCI Bank", "BOA Togo", "Société Générale Togo"],
    phones: "+228",
    firstNames: ["Faure", "Yvette", "Komi", "Akossiwa", "Kodjo", "Abla", "Mawuli", "Ama", "Yawo", "Déla", "Sena", "Afi"],
    lastNames: ["Gnassingbé", "Eyadéma", "Olympio", "Grunitzky", "Kodjo", "Agboyibor", "Klassou", "Mally", "Dossou", "Adade"],
    companies: ["Togo Telecom", "CEET Power", "PAL Port Authority", "Brasserie BB Lomé", "Air Togo", "Togo Mining"],
    courts: ["Supreme Court of Togo", "Court of Appeal Lomé", "Commercial Court Lomé", "Tribunal of Kara"],
  },
  Tunisia: {
    currency: "TND", idPrefix: "TUN",
    cities: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana", "Gafsa"],
    regions: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana", "Gafsa"],
    banks: ["BIAT Bank", "STB Bank", "Amen Bank", "BNA Tunisia", "Attijari Bank Tunisia"],
    phones: "+216",
    firstNames: ["Kais", "Leila", "Béji", "Olfa", "Moncef", "Sarra", "Zine", "Amel", "Habib", "Rim", "Mohamed", "Ines"],
    lastNames: ["Saied", "Essebsi", "Marzouki", "Ben Ali", "Bourguiba", "Ghannouchi", "Jomaa", "Chahed", "Mechichi", "Bouden"],
    companies: ["Tunisair", "Tunisie Telecom", "STEG Power", "Group Chimique Tunisien", "Poulina Group", "Délice Danone"],
    courts: ["Court of Cassation Tunisia", "Court of Appeal Tunis", "Commercial Court Sfax", "Tribunal of Sousse"],
  },
  Uganda: {
    currency: "UGX", idPrefix: "UGA",
    cities: ["Kampala", "Jinja", "Gulu", "Mbarara", "Entebbe", "Fort Portal", "Lira", "Mbale"],
    regions: ["Central", "Eastern", "Northern", "Western", "Kampala", "Wakiso", "Mukono", "Jinja"],
    banks: ["Stanbic Bank Uganda", "DFCU Bank", "Centenary Bank", "Bank of Uganda", "Equity Bank Uganda"],
    phones: "+256",
    firstNames: ["Ssemakula", "Nakato", "Mugisha", "Apio", "Okello", "Nalubega", "Byaruhanga", "Atim", "Mubiru", "Nambi", "Kagwa", "Akello"],
    lastNames: ["Nsamba", "Lubega", "Kato", "Tumusiime", "Otim", "Namutebi", "Ssentamu", "Babirye", "Mukasa", "Kabanda", "Nakabugo", "Wamala"],
    companies: ["Kampala Motors Ltd", "Jinja Steel Works Ltd", "Entebbe Aviation Services Ltd", "Mbarara Dairy Cooperative", "Gulu Agricultural Supplies Ltd", "Fort Portal Tourism Holdings"],
    courts: ["High Court of Kampala", "Chief Magistrates Court Jinja", "Supreme Court of Uganda", "Commercial Court Kampala"],
  },
  Zambia: {
    currency: "ZMW", idPrefix: "ZMB",
    cities: ["Lusaka", "Kitwe", "Ndola", "Kabwe", "Livingstone", "Chipata", "Solwezi", "Mansa"],
    regions: ["Lusaka", "Copperbelt", "Copperbelt", "Central", "Southern", "Eastern", "North-Western", "Luapula"],
    banks: ["Zanaco Bank", "Standard Chartered Zambia", "Stanbic Bank Zambia", "FNB Zambia", "Atlas Mara Zambia"],
    phones: "+260",
    firstNames: ["Hakainde", "Mutale", "Edgar", "Esther", "Michael", "Inonge", "Rupiah", "Christine", "Levy", "Maureen", "Frederick", "Grace"],
    lastNames: ["Hichilema", "Lungu", "Sata", "Banda", "Mwanawasa", "Chiluba", "Kaunda", "Wina", "Nalumango", "Mutati"],
    companies: ["Zesco Power", "Airtel Zambia", "KCM Mining", "Zambia Breweries", "Zambia Railways", "Shoprite Zambia"],
    courts: ["Supreme Court of Zambia", "High Court Lusaka", "Commercial Court Lusaka", "Industrial Court Kitwe"],
  },
  Zimbabwe: {
    currency: "ZWL", idPrefix: "ZWE",
    cities: ["Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru", "Masvingo", "Kwekwe", "Kadoma"],
    regions: ["Harare", "Bulawayo", "Harare", "Manicaland", "Midlands", "Masvingo", "Midlands", "Mashonaland West"],
    banks: ["CBZ Bank", "Stanbic Bank Zimbabwe", "FBC Bank", "ZB Bank", "NMB Bank Zimbabwe"],
    phones: "+263",
    firstNames: ["Emmerson", "Auxillia", "Robert", "Grace", "Morgan", "Joice", "Nelson", "Thokozani", "Tendai", "Rutendo", "Tinashe", "Chiedza"],
    lastNames: ["Mnangagwa", "Mugabe", "Tsvangirai", "Chamisa", "Mujuru", "Chinamasa", "Moyo", "Ncube", "Biti", "Khupe"],
    companies: ["Econet Wireless", "ZESA Power", "Delta Beverages", "Old Mutual Zimbabwe", "NRZ Railways", "Zimplats Mining"],
    courts: ["Supreme Court of Zimbabwe", "High Court Harare", "Commercial Court Harare", "Labour Court Bulawayo"],
  },
};

const sectors = ["Agriculture", "Manufacturing", "Services", "Construction", "Mining", "Technology", "Healthcare", "Education", "Transportation", "Finance", "Energy", "Retail", "Tourism", "Telecommunications"];
const occupations = ["Engineer", "Teacher", "Doctor", "Accountant", "Lawyer", "Trader", "Farmer", "Nurse", "Architect", "IT Specialist", "Civil Servant", "Banker", "Pharmacist", "Consultant"];
const accountTypes = ["Personal Loan", "Mortgage", "Vehicle Loan", "Business Loan", "Overdraft", "Credit Card", "Agricultural Loan", "Trade Finance", "Microfinance Loan", "Working Capital"];
const collateralTypes = ["Property", "Real Estate", "Vehicle", "Equipment & Machinery", "Inventory", "Accounts Receivable", "Land Title", "Government Securities", "Cash Deposit", null];
const genders = ["Male", "Female"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDec(min: number, max: number): string { return (Math.random() * (max - min) + min).toFixed(2); }
function pastDate(yearsBack: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - randInt(0, yearsBack));
  d.setMonth(randInt(0, 11));
  d.setDate(randInt(1, 28));
  return d.toISOString().split("T")[0];
}
function futureDate(yearsAhead: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + randInt(1, yearsAhead));
  d.setMonth(randInt(0, 11));
  d.setDate(randInt(1, 28));
  return d.toISOString().split("T")[0];
}
function padId(n: number): string { return String(n).padStart(5, "0"); }

export async function seedTestData() {
  const allCountries = Object.keys(countryData);

  const [existingBorrowers] = await db.select({ value: count() }).from(borrowers);

  const missingCountries: string[] = [];
  for (const c of allCountries) {
    const prefix = countryData[c].idPrefix;
    const [check] = await db.select({ value: count() }).from(borrowers).where(like(borrowers.nationalId, `${prefix}%`));
    if (check.value === 0) missingCountries.push(c);
  }

  if (missingCountries.length === 0) {
    console.log(`All ${allCountries.length} countries already have borrower data, skipping`);
    return;
  }

  const [adminUser] = await db.select().from(users).limit(1);
  if (!adminUser) {
    console.log("No users found — run main seed first");
    return;
  }

  console.log(`Seeding test data for ${missingCountries.length} countries: ${missingCountries.join(", ")}...`);

  const BATCH_SIZE = 200;
  let idCounter = 100000 + Math.floor(Math.random() * 50000);
  let totalBorrowers = 0;
  let totalAccounts = 0;
  const usedCompanies = new Set<string>();

  for (const country of missingCountries) {
    const cfg = countryData[country];
    const borrowerValues: any[] = [];

    for (let i = 0; i < 12; i++) {
      const cityIdx = i % cfg.cities.length;
      const fn = pick(cfg.firstNames);
      const ln = pick(cfg.lastNames);
      idCounter++;
      borrowerValues.push({
        type: "individual" as const,
        firstName: fn,
        lastName: ln,
        nationalId: `${cfg.idPrefix}-ID-${padId(idCounter)}`,
        tinNumber: `TIN-${cfg.idPrefix}-${padId(idCounter)}`,
        dateOfBirth: pastDate(40),
        gender: pick(genders),
        phone: `${cfg.phones}${randInt(700000000, 999999999)}`,
        email: `${fn.toLowerCase().replace(/[^a-z]/g, "")}.${ln.toLowerCase().replace(/[^a-z]/g, "")}${randInt(1, 99)}@mail.com`,
        address: `${randInt(1, 200)} ${pick(["Main St", "Market Rd", "Independence Ave", "Liberation Blvd", "Commerce Lane", "Unity Drive"])}`,
        country,
        city: cfg.cities[cityIdx],
        region: cfg.regions[cityIdx],
        employerName: `${pick(["National", "Regional", "City", "Central", "Metro"])} ${pick(["Bank", "Hospital", "School", "Office", "Corp"])}`,
        occupation: pick(occupations),
        sector: pick(sectors),
        isPep: Math.random() < 0.08,
        pepDetails: Math.random() < 0.08 ? `${pick(["Member of Parliament", "Senior Government Official", "Central Bank Board", "State Enterprise Director"])} - ${country}` : null,
      });
    }

    for (let i = 0; i < 4; i++) {
      let companyName = pick(cfg.companies);
      let attempts = 0;
      while (usedCompanies.has(companyName) && attempts < 5) {
        companyName = `${companyName} (${pick(["North", "South", "East", "West"])})`;
        attempts++;
      }
      usedCompanies.add(companyName);
      const cityIdx = i % cfg.cities.length;
      idCounter++;
      borrowerValues.push({
        type: "corporate" as const,
        companyName,
        nationalId: `${cfg.idPrefix}-BIZ-${padId(idCounter)}`,
        tinNumber: `TIN-${cfg.idPrefix}-C-${padId(idCounter)}`,
        phone: `${cfg.phones}${randInt(200000000, 599999999)}`,
        email: `info@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)}.com`,
        address: `${pick(["Industrial Zone", "Business District", "Commercial Area", "Free Trade Zone"])}, Plot ${randInt(1, 500)}`,
        country,
        city: cfg.cities[cityIdx],
        region: cfg.regions[cityIdx],
        businessRegNumber: `BR-${cfg.idPrefix}-${randInt(2005, 2024)}-${padId(randInt(1, 9999))}`,
        sector: pick(sectors),
        isPep: false,
      });
    }

    const createdBorrowers = await db.insert(borrowers).values(borrowerValues).returning();
    totalBorrowers += createdBorrowers.length;

    const accountValues: any[] = [];
    const statuses: Array<"current" | "delinquent" | "default" | "closed" | "restructured" | "written_off"> = ["current", "current", "current", "current", "delinquent", "default", "closed", "restructured", "written_off"];

    for (const b of createdBorrowers) {
      const numAccounts = randInt(1, 3);
      for (let a = 0; a < numAccounts; a++) {
        const status = pick(statuses);
        const isCorporate = b.type === "corporate";
        const amountMultiplier = isCorporate ? randInt(50, 500) : randInt(1, 50);
        const original = (amountMultiplier * 10000).toString() + ".00";
        const balRatio = status === "closed" ? 0 : Math.random() * 0.8 + 0.1;
        const current = (amountMultiplier * 10000 * balRatio).toFixed(2);
        const useForeignCurrency = Math.random() < 0.15;
        const currency = useForeignCurrency ? pick(["USD", "EUR", "GBP"]) : cfg.currency;

        accountValues.push({
          borrowerId: b.id,
          lenderInstitution: pick(cfg.banks),
          accountNumber: `${cfg.idPrefix.slice(0, 3)}-${pick(["LN", "OD", "CC", "ML", "TF"])}-${randInt(2020, 2025)}-${padId(randInt(1, 9999))}`,
          accountType: pick(accountTypes),
          originalAmount: original,
          currentBalance: current,
          currency,
          interestRate: randDec(5, 22),
          disbursementDate: pastDate(5),
          maturityDate: futureDate(5),
          status,
          daysInArrears: status === "delinquent" ? randInt(30, 180) : status === "default" ? randInt(181, 720) : 0,
          collateralType: pick(collateralTypes),
          collateralValue: Math.random() > 0.3 ? (amountMultiplier * 10000 * (1 + Math.random())).toFixed(2) : null,
          lastPaymentDate: status !== "written_off" ? pastDate(1) : null,
          lastPaymentAmount: status !== "written_off" ? (amountMultiplier * 100 * (0.5 + Math.random())).toFixed(2) : null,
          restructureCount: status === "restructured" ? randInt(1, 3) : 0,
          writtenOffDate: status === "written_off" ? pastDate(1) : null,
        });
      }
    }

    const createdAccounts = await db.insert(creditAccounts).values(accountValues).returning();
    totalAccounts += createdAccounts.length;
  }

  console.log(`  Created ${totalBorrowers} borrowers across ${missingCountries.length} countries`);
  console.log(`  Created ${totalAccounts} credit accounts`);

  const allCreatedBorrowers = await db.select().from(borrowers).where(
    like(borrowers.nationalId, `%-ID-%`)
  );

  const paymentValues: any[] = [];
  const paymentStatuses: Array<"on_time" | "late" | "missed" | "partial"> = ["on_time", "on_time", "on_time", "on_time", "late", "missed", "partial"];
  const sampleAccounts = await db.select().from(creditAccounts);
  const accountSubset = sampleAccounts.slice(0, Math.min(200, sampleAccounts.length));

  for (const acc of accountSubset) {
    if (paymentValues.length > 1000) break;
    const numPayments = randInt(2, 5);
    for (let p = 0; p < numPayments; p++) {
      const d = new Date();
      d.setMonth(d.getMonth() - p - 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const amountDue = randDec(500, 50000);
      const pStatus = pick(paymentStatuses);
      const paidRatio = pStatus === "on_time" ? 1 : pStatus === "partial" ? 0.4 + Math.random() * 0.5 : pStatus === "missed" ? 0 : 1;
      paymentValues.push({
        creditAccountId: acc.id,
        period,
        amountDue,
        amountPaid: (parseFloat(amountDue) * paidRatio).toFixed(2),
        status: pStatus,
        daysLate: pStatus === "late" ? randInt(1, 60) : pStatus === "missed" ? randInt(30, 90) : 0,
      });
    }
  }

  if (paymentValues.length > 0) {
    for (let i = 0; i < paymentValues.length; i += BATCH_SIZE) {
      await db.insert(paymentHistory).values(paymentValues.slice(i, i + BATCH_SIZE));
    }
    console.log(`  Created ${paymentValues.length} payment history records`);
  }

  const disputeStatuses: Array<"open" | "under_review" | "resolved" | "rejected"> = ["open", "open", "under_review", "resolved", "rejected"];
  const disputeTypes = ["incorrect_balance", "wrong_account_status", "identity_theft", "duplicate_entry", "incorrect_personal_info", "unauthorized_inquiry"];
  const disputeValues: any[] = [];
  const adminUser2 = (await db.select().from(users).limit(1))[0];
  const sampleBorrowers = allCreatedBorrowers.slice(0, 100);

  for (let d = 0; d < Math.min(40, sampleBorrowers.length); d++) {
    const b = pick(sampleBorrowers);
    const status = pick(disputeStatuses);
    const now = new Date();
    const slaDeadline = new Date(now);
    slaDeadline.setDate(slaDeadline.getDate() + randInt(-5, 25));
    disputeValues.push({
      borrowerId: b.id,
      filedBy: adminUser2.id,
      disputeType: pick(disputeTypes),
      description: pick([
        "The balance shown does not match my bank statement records",
        "This account was closed but still shows as active",
        "I did not open this account — possible identity theft",
        "This appears to be a duplicate entry from another institution",
        "My personal information including name and address is incorrect",
        "I did not authorize this credit inquiry",
      ]),
      status,
      resolution: status === "resolved" ? pick(["Corrected as per borrower evidence", "Verified and updated in system", "Removed duplicate entry"]) : null,
      slaDeadline,
    });
  }
  if (disputeValues.length > 0) {
    await db.insert(disputes).values(disputeValues);
    console.log(`  Created ${disputeValues.length} disputes`);
  }

  const judgmentTypes: Array<"lien" | "bankruptcy" | "lawsuit" | "civil_judgment" | "criminal_conviction"> = ["lien", "bankruptcy", "lawsuit", "civil_judgment", "criminal_conviction"];
  const judgmentStatuses: Array<"active" | "resolved" | "appealed"> = ["active", "active", "resolved", "appealed"];
  const judgmentValues: any[] = [];

  for (let j = 0; j < Math.min(30, sampleBorrowers.length); j++) {
    const b = pick(sampleBorrowers);
    const bCountry = b.country || "Ethiopia";
    const cfg = countryData[bCountry] || countryData["Ethiopia"];
    judgmentValues.push({
      borrowerId: b.id,
      caseNumber: `${bCountry.slice(0, 2).toUpperCase()}-${randInt(2020, 2025)}-CV-${padId(randInt(1, 9999))}`,
      court: pick(cfg.courts),
      judgmentType: pick(judgmentTypes),
      amount: randDec(5000, 500000),
      currency: cfg.currency,
      judgmentDate: pastDate(3),
      status: pick(judgmentStatuses),
      description: pick([
        "Failure to repay commercial loan",
        "Breach of contract — supply agreement",
        "Lien placed on commercial property",
        "Bankruptcy filing — voluntary",
        "Default on mortgage obligation",
        "Tax lien — unpaid corporate taxes",
      ]),
    });
  }
  if (judgmentValues.length > 0) {
    await db.insert(courtJudgments).values(judgmentValues);
    console.log(`  Created ${judgmentValues.length} court judgments`);
  }

  const consentValues: any[] = [];
  let receiptCounter = 80000 + randInt(0, 10000);
  for (const b of sampleBorrowers.slice(0, 80)) {
    const bCountry = b.country || "Ethiopia";
    const cfg = countryData[bCountry] || countryData["Ethiopia"];
    receiptCounter++;
    consentValues.push({
      borrowerId: b.id,
      grantedTo: pick(cfg.banks),
      purpose: pick(["Credit Report Access", "Data Sharing", "Portfolio Monitoring", "Collection Activities", "New Credit Application"]),
      consentType: pick(["explicit", "implied", "blanket"]),
      status: Math.random() < 0.85 ? "active" as const : "revoked" as const,
      receiptNumber: `CR-${cfg.idPrefix}-${receiptCounter}`,
    });
  }
  if (consentValues.length > 0) {
    await db.insert(consentRecords).values(consentValues);
    console.log(`  Created ${consentValues.length} consent records`);
  }

  const institutionTypes = ["Commercial Bank", "Microfinance Institution", "Development Bank", "Savings & Credit Cooperative", "Insurance Company"];
  const instValues: any[] = [];
  const instStatuses: Array<"pending" | "active" | "suspended"> = ["active", "active", "active", "pending", "suspended"];

  for (const country of missingCountries) {
    const cfg = countryData[country];
    for (const bank of cfg.banks) {
      const bankKey = `${bank}-${country}`;
      if (usedCompanies.has(bankKey)) continue;
      usedCompanies.add(bankKey);
      instValues.push({
        name: bank,
        type: pick(institutionTypes),
        registrationNumber: `REG-${cfg.idPrefix}-${padId(randInt(1000, 9999))}`,
        country,
        contactEmail: `compliance@${bank.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        contactPhone: `${cfg.phones}${randInt(100000000, 999999999)}`,
        address: `${pick(cfg.cities)}, ${pick(cfg.regions)}`,
        status: pick(instStatuses),
        submissionFrequency: pick(["monthly", "quarterly", "weekly"]),
      });
    }
  }
  if (instValues.length > 0) {
    for (let i = 0; i < instValues.length; i += BATCH_SIZE) {
      await db.insert(institutions).values(instValues.slice(i, i + BATCH_SIZE));
    }
    console.log(`  Created ${instValues.length} institutions`);
  }

  const billingValues: any[] = [];
  const serviceTypes = ["Credit Report", "Bulk Data Submission", "API Access", "Dispute Resolution", "Annual Subscription"];
  const billingStatuses: Array<"pending" | "paid" | "overdue"> = ["paid", "paid", "paid", "pending", "overdue"];
  let invoiceCounter = 20000 + randInt(0, 5000);

  for (const country of missingCountries) {
    const cfg = countryData[country];
    for (const bank of cfg.banks.slice(0, 3)) {
      for (let m = 0; m < 2; m++) {
        invoiceCounter++;
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const periodStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        const endMonth = new Date(d);
        endMonth.setMonth(endMonth.getMonth() + 1);
        endMonth.setDate(0);
        const periodEnd = endMonth.toISOString().split("T")[0];
        billingValues.push({
          institutionName: bank,
          serviceType: pick(serviceTypes),
          amount: randDec(500, 25000),
          currency: cfg.currency,
          status: pick(billingStatuses),
          invoiceNumber: `INV-${cfg.idPrefix}-${invoiceCounter}`,
          periodStart,
          periodEnd,
        });
      }
    }
  }
  if (billingValues.length > 0) {
    for (let i = 0; i < billingValues.length; i += BATCH_SIZE) {
      await db.insert(billingRecords).values(billingValues.slice(i, i + BATCH_SIZE));
    }
    console.log(`  Created ${billingValues.length} billing records`);
  }

  console.log(`Test data seeding complete for ${missingCountries.length} countries!`);
}
