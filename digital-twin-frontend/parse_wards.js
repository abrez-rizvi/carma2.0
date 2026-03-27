const fs = require('fs');

const text = `1 NARELA Narela
2 BANKNER Narela
3 HOLAMBI KALAN Narela
4 ALIPUR Narela
5 BAKHTAWARPUR Narela
26 POOTH KALAN Narela
27 BEGUMPUR Narela
28 SHAHBAAD DAIRY Narela
29 POOTH KHURD Narela
30 BAWANA Narela
31 NANGAL THAKRAN Narela
32 KANJHAWALA Narela
33 RANI KHERA Narela
34 NANGLOI Narela
35 MUNDKA Narela
36 NILOTHI Narela
6 BURARI Civil Line
7 KADIPUR Civil Line
8 MUKUNDPUR Civil Line
9 SANT NAGAR Civil Line
10 JHARODA Civil Line
11 TIMARPUR Civil Line
12 MALKA GANJ Civil Line
13 MUKHERJEE NAGAR Civil Line
14 DHIRPUR Civil Line
15 ADARSH NAGAR Civil Line
16 AZADPUR Civil Line
17 BHALSWA Civil Line
18 JAHANGIR PURI Civil Line
19 SARUP NAGAR Civil Line
20 SAMAYPUR BADLI Civil Line
21 ROHINI-A Rohini
22 ROHINI-B Rohini
23 RITHALA Rohini
24 VIJAY VIHAR Rohini
25 BUDH VIHAR Rohini
37 KIRARI Rohini
38 PREM NAGAR Rohini
39 MUBARIKPUR Rohini
40 NITHARI Rohini
41 AMAN VIHAR Rohini
42 MANGOL PURI Rohini
43 SULTANPURI-A Rohini
44 SULTANPURI-B Rohini
45 JAWALAPURI Rohini
46 NANGLOI JAT Rohini
47 NIHAL VIHAR Rohini
48 GURU HARKISHAN NAGAR Rohini
49 MANGOLPURI-A Rohini
50 MANGOLPURI-B Rohini
51 ROHINI-C Rohini
52 ROHINI-F Rohini
53 ROHINI-E Rohini
54 ROHINI-D Rohini
55 SHALIMAR BAGH-A Keshavpuram
56 SHALIMAR BAGH-B Keshavpuram
57 PITAM PURA Keshavpuram
58 SARASWATI VIHAR Keshavpuram
59 PASCHIM VIHAR Keshavpuram
60 RANI BAGH Keshavpuram
61 KOHAT ENCLAVE Keshavpuram
62 SHAKUR PUR Keshavpuram
63 TRI NAGAR Keshavpuram
64 KESHAV PURAM Keshavpuram
65 ASHOK VIHAR Keshavpuram
66 WAZIR PUR Keshavpuram
67 SANGAM PARK Keshavpuram
68 MODEL TOWN Keshavpuram
69 KAMLA NAGAR Keshavpuram
70 SHASTRI NAGAR City S.P.Zone
71 KISHAN GANJ City S.P.Zone
72 SADAR BAZAR City S.P.Zone
73 CIVIL LINES City S.P.Zone
74 CHANDNI CHOWK City S.P.Zone
75 JAMA MASJID City S.P.Zone
76 CHANDANI MAHAL City S.P.Zone
77 DELHI GATE City S.P.Zone
78 BAZAR SITA RAM City S.P.Zone
79 BALLIMARAN City S.P.Zone
80 RAM NAGAR City S.P.Zone
81 QURAISH NAGAR City S.P.Zone
82 PAHAR GANJ Karolbagh
83 KAROL BAGH Karolbagh
84 DEV NAGAR Karolbagh
85 WEST PATEL NAGAR Karolbagh
86 EAST PATEL NAGAR Karolbagh
87 RANJEET NAGAR Karolbagh
88 BALJEET NAGAR Karolbagh
89 KARAM PURA Karolbagh
90 MOTI NAGAR Karolbagh
91 RAMESH NAGAR Karolbagh
139 NARAINA Karolbagh
140 INDER PURI Karolbagh
141 RAJINDER NAGAR Karolbagh
92 PUNJABI BAGH West Zone
93 MADIPUR West Zone
94 RAGHUBIR NAGAR West Zone
95 VISHNU GARDEN West Zone
96 RAJOURI GARDEN West Zone
97 CHAUKHANDI NAGAR West Zone
98 SUBHASH NAGAR West Zone
99 HARI NAGAR West Zone
100 FATEH NAGAR West Zone
101 TILAK NAGAR West Zone
102 KHYALA West Zone
103 KESHOPUR West Zone
104 JANAK PURI SOUTH West Zone
105 MAHAVEER ENCLAVE West Zone
106 JANAK PURI WEST West Zone
107 VIKAS PURI West Zone
108 HASTSAL West Zone
109 VIKAS NAGAR West Zone
110 KUNWAR SINGH NAGAR West Zone
111 BAPROLA West Zone
112 SAINIK ENCLAVE West Zone
113 MOHAN GARDEN West Zone
114 NAWADA West Zone
115 UTTAM NAGAR West Zone
116 BINDA PUR West Zone
Ward No. Ward Name Zone Name
117 DABRI Najafgarh Zone
118 SAGARPUR Najafgarh Zone
119 MANGLAPURI Najafgarh Zone
120 DWARKA-B Najafgarh Zone
121 DWARKA-A Najafgarh Zone
122 MATIALA Najafgarh Zone
123 KAKROLA Najafgarh Zone
124 NANGLI SAKRAWATI Najafgarh Zone
125 CHHAWALA Najafgarh Zone
126 ISAPUR Najafgarh Zone
127 NAJAFGARH Najafgarh Zone
128 DICHAON KALAN Najafgarh Zone
129 ROSHAN PURA Najafgarh Zone
130 DWARKA-C Najafgarh Zone
131 BIJWASAN Najafgarh Zone
132 KAPASHERA Najafgarh Zone
133 MAHIPALPUR Najafgarh Zone
134 RAJ NAGAR Najafgarh Zone
135 PALAM Najafgarh Zone
136 MADHU VIHAR Najafgarh Zone
137 MAHAVIR ENCLAVE Najafgarh Zone
138 SADH NAGAR Najafgarh Zone
142 DARYAGANJ Central Zone
143 SIDHARTHA NAGAR Central Zone
144 LAJPAT NAGAR Central Zone
145 ANDREWS GANJ Central Zone
146 AMAR COLONY Central Zone
147 KOTLA MUBARAKPUR Central Zone
168 SANGAM VIHAR-C Central Zone
169 SANGAM VIHAR-B Central Zone
170 TUGHLAKABAD EXTENSION Central Zone
174 SRI NIWAS PURI Central Zone
175 KALKAJI Central Zone
176 GOVIND PURI Central Zone
177 HARKESH NAGAR Central Zone
178 TUGHLAKABAD Central Zone
179 PUL PEHLADPUR Central Zone
180 BADARPUR Central Zone
181 MOLARBAND Central Zone
182 MEETHAPUR Central Zone
183 HARI NAGAR EXTENSION Central Zone
184 JAITPUR Central Zone
185 MADANPUR KHADAR EAST Central Zone
186 MADANPUR KHADAR WEST Central Zone
187 SARITA VIHAR Central Zone
188 ABUL FAZAL ENCLAVE Central Zone
189 ZAKIR NAGAR Central Zone
148 HAUZ KHAS South Zone
149 MALVIYA NAGAR South Zone
150 GREEN PARK South Zone
151 MUNIRKA South Zone
152 R.K. PURAM South Zone
153 VASANT VIHAR South Zone
154 LADO SARAI South Zone
155 MEHRAULI South Zone
156 VASANT KUNJ South Zone
157 AYA NAGAR South Zone
158 BHATI South Zone
159 CHHATARPUR South Zone
160 SAID-UL-AJAIB South Zone
161 DEOLI South Zone
162 TIGRI South Zone
163 SANGAM VIHAR-A South Zone
164 DAKSHIN PURI South Zone
165 MADANGIR South Zone
166 PUSHP VIHAR South Zone
167 KHANPUR South Zone
171 CHITARANJAN PARK South Zone
172 CHIRAG DELHI South Zone
173 GREATER KAILASH South Zone
190 NEW ASHOK NAGAR Shahdara South Zone
191 MAYUR VIHAR PHASE-I Shahdara South Zone
192 TRILOKPURI Shahdara South Zone
193 KONDLI Shahdara South Zone
194 GHAROLI Shahdara South Zone
195 KALYANPURI Shahdara South Zone
196 MAYUR VIHAR PHASE-II Shahdara South Zone
197 PATPAR GANJ Shahdara South Zone
198 VINOD NAGAR Shahdara South Zone
199 MANDAWALI Shahdara South Zone
200 PANDAV NAGAR Shahdara South Zone
201 LALITA PARK Shahdara South Zone
202 SHAKARPUR Shahdara South Zone
203 LAXMI NAGAR Shahdara South Zone
204 PREET VIHAR Shahdara South Zone
205 I.P. EXTENSION Shahdara South Zone
206 ANAND VIHAR Shahdara South Zone
207 VISHWAS NAGAR Shahdara South Zone
208 ANARKALI Shahdara South Zone
209 JAGAT PURI Shahdara South Zone
210 GEETA COLONY Shahdara South Zone
211 KRISHNA NAGAR Shahdara South Zone
212 GANDHI NAGAR Shahdara South Zone
213 SHASTRI PARK Shahdara South Zone
214 AZAD NAGAR Shahdara South Zone
215 SHAHDARA Shahdara South Zone
216 JHILMIL Shahdara North Zone
217 DILSHAD COLONY Shahdara North Zone
218 SUNDAR NAGRI Shahdara North Zone
219 DILSHAD GARDEN Shahdara North Zone
220 NAND NAGRI Shahdara North Zone
221 ASHOK NAGAR Shahdara North Zone
222 RAM NAGAR EAST Shahdara North Zone
223 ROHTASH NAGAR Shahdara North Zone
224 WELCOME COLONY Shahdara North Zone
225 SEELAMPUR Shahdara North Zone
226 GAUTAM PURI Shahdara North Zone
227 CHAUHAN BANGER Shahdara North Zone
228 MAUJPUR Shahdara North Zone
229 BRAHAM PURI Shahdara North Zone
230 BHAJANPURA Shahdara North Zone
231 GHONDA Shahdara North Zone
232 YAMUNA VIHAR Shahdara North Zone
233 SUBHASH MOHALLA Shahdara North Zone
234 KABIR NAGAR Shahdara North Zone
235 GORAKH PARK Shahdara North Zone
236 KARDAM PURI Shahdara North Zone
237 HARSH VIHAR Shahdara North Zone
238 SABOLI Shahdara North Zone
239 GOKAL PURI Shahdara North Zone
240 JOHARIPUR Shahdara North Zone
241 KARAWAL NAGAR-EAST Shahdara North Zone
242 DAYALPUR Shahdara North Zone
243 MUSTAFABAD Shahdara North Zone
244 NEHRU VIHAR Shahdara North Zone
245 BRIJ PURI Shahdara North Zone
246 SRI RAM COLONY Shahdara North Zone
247 SADATPUR Shahdara North Zone
248 KARAWAL NAGAR-WEST Shahdara North Zone
249 SONIA VIHAR Shahdara North Zone
250 SABAPUR Shahdara North Zone`;

const lines = text.split('\n');
const wards = [];

for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('Ward No')) continue;
  
  const match = t.match(/^(\d+)\s+(.*?)\s+([\w\.\s]+(?:Zone|Line|Narela|Rohini|Keshavpuram|Karolbagh))$/i);
  if (match) {
    wards.push({
      id: parseInt(match[1]),
      name: match[2].trim(),
      zone: match[3].trim()
    });
  } else {
    // Fallback parsing: First numeric is ID. 
    // Usually the zone is Title Case or explicit 'Zone', 'Line'
    const parts = t.split(' ');
    const id = parseInt(parts[0]);
    let nameParts = [];
    let zoneParts = [];
    let foundZone = false;
    for (let i = 1; i < parts.length; i++) {
        if (!foundZone && parts[i] === parts[i].toUpperCase() && !parts[i].includes('Zone')) {
            nameParts.push(parts[i]);
        } else {
            foundZone = true;
            zoneParts.push(parts[i]);
        }
    }
    // Specific fix for "Delhi Gate City S.P.Zone" -> DELHI GATE is name
    if (nameParts.length === 0) {
        nameParts = parts.slice(1, -2);
        zoneParts = parts.slice(-2);
    }
    
    wards.push({
      id: id,
      name: nameParts.join(' ').trim(),
      zone: zoneParts.join(' ').trim()
    });
  }
}

const fileContent = `export interface Ward {
  id: number;
  name: string;
  zone: string;
}

export const delhiWards: Ward[] = ${JSON.stringify(wards, null, 2)};
`;

fs.writeFileSync('src/data/delhiWards.ts', fileContent);
console.log('Done');
