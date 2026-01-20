import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import path from 'path';
import fs from 'fs';

const sqlite = new Database(path.join(__dirname, '../../../data/metro.db'));
const db = drizzle(sqlite, { schema });

interface CompleteMetroData {
  lines: Array<{
    id: string;
    name: string;
    color: string;
    displayOrder: number;
    code: string;
  }>;
  stations: {
    [key: string]: Array<{
      name: string;
      isInterchange: boolean;
    }>;
  };
}

// Approximate coordinates for stations (based on actual locations)
const stationCoordinates: { [key: string]: { lat: number; lng: number } } = {
  // Red Line
  "Rithala": { lat: 28.7213, lng: 77.1016 },
  "Rohini West": { lat: 28.7177, lng: 77.1132 },
  "Rohini East": { lat: 28.7148, lng: 77.1213 },
  "Pitampura": { lat: 28.7041, lng: 77.1312 },
  "Kohat Enclave": { lat: 28.6949, lng: 77.1304 },
  "Netaji Subhash Place": { lat: 28.6951, lng: 77.1517 },
  "Keshav Puram": { lat: 28.6853, lng: 77.1682 },
  "Kanhaiya Nagar": { lat: 28.6784, lng: 77.1744 },
  "Inderlok": { lat: 28.6719, lng: 77.1782 },
  "Shastri Nagar": { lat: 28.6654, lng: 77.1863 },
  "Pratap Nagar": { lat: 28.6605, lng: 77.1953 },
  "Pulbangash": { lat: 28.6580, lng: 77.2075 },
  "Tis Hazari": { lat: 28.6633, lng: 77.2173 },
  "Kashmere Gate": { lat: 28.6676, lng: 77.2273 },
  "Shastri Park": { lat: 28.6692, lng: 77.2380 },
  "Seelampur": { lat: 28.6696, lng: 77.2521 },
  "Welcome": { lat: 28.6710, lng: 77.2752 },
  "Shahdara": { lat: 28.6855, lng: 77.2978 },
  "Mansarovar Park": { lat: 28.6986, lng: 77.3026 },
  "Jhilmil": { lat: 28.7079, lng: 77.3145 },
  "Dilshad Garden": { lat: 28.7147, lng: 77.3181 },
  "Shaheed Nagar": { lat: 28.7188, lng: 77.3312 },
  "Raj Bagh": { lat: 28.7206, lng: 77.3467 },
  "Major Mohit Sharma Rajendra Nagar": { lat: 28.7261, lng: 77.3636 },
  "Shyam Park": { lat: 28.7294, lng: 77.3735 },
  "Mohan Nagar": { lat: 28.7337, lng: 77.3892 },
  "Arthala": { lat: 28.7395, lng: 77.4020 },
  "Hindon River": { lat: 28.7453, lng: 77.4159 },
  "Shaheed Sthal (New Bus Adda)": { lat: 28.7518, lng: 77.4337 },

  // Yellow Line
  "Samaypur Badli": { lat: 28.7970, lng: 77.1347 },
  "Rohini Sector 18-19": { lat: 28.7467, lng: 77.1215 },
  "Haiderpur Badli Mor": { lat: 28.7383, lng: 77.1422 },
  "Jahangirpuri": { lat: 28.7287, lng: 77.1629 },
  "Adarsh Nagar": { lat: 28.7134, lng: 77.1709 },
  "Azadpur": { lat: 28.7037, lng: 77.1781 },
  "Model Town": { lat: 28.6988, lng: 77.1916 },
  "GTB Nagar": { lat: 28.6978, lng: 77.2068 },
  "Vishwavidyalaya": { lat: 28.6940, lng: 77.2116 },
  "Vidhan Sabha": { lat: 28.6858, lng: 77.2163 },
  "Civil Lines": { lat: 28.6778, lng: 77.2211 },
  "Chandni Chowk": { lat: 28.6579, lng: 77.2304 },
  "Chawri Bazar": { lat: 28.6494, lng: 77.2284 },
  "New Delhi": { lat: 28.6431, lng: 77.2197 },
  "Rajiv Chowk": { lat: 28.6328, lng: 77.2197 },
  "Patel Chowk": { lat: 28.6249, lng: 77.2088 },
  "Central Secretariat": { lat: 28.6143, lng: 77.2116 },
  "Udyog Bhawan": { lat: 28.6085, lng: 77.2146 },
  "Lok Kalyan Marg (Race Course)": { lat: 28.5993, lng: 77.2131 },
  "Jorbagh": { lat: 28.5868, lng: 77.2173 },
  "Dilli Haat INA": { lat: 28.5738, lng: 77.2081 },
  "AIIMS": { lat: 28.5695, lng: 77.2073 },
  "Green Park": { lat: 28.5602, lng: 77.2065 },
  "Hauz Khas": { lat: 28.5434, lng: 77.2069 },
  "Malviya Nagar": { lat: 28.5287, lng: 77.2054 },
  "Saket": { lat: 28.5202, lng: 77.2063 },
  "Qutab Minar": { lat: 28.5128, lng: 77.1857 },
  "Chhattarpur": { lat: 28.5069, lng: 77.1750 },
  "Sultanpur": { lat: 28.4994, lng: 77.1615 },
  "Ghitorni": { lat: 28.4937, lng: 77.1498 },
  "Arjan Garh": { lat: 28.4805, lng: 77.1252 },
  "Guru Dronacharya": { lat: 28.4688, lng: 77.1023 },
  "Sikanderpur": { lat: 28.4794, lng: 77.0899 },
  "MG Road": { lat: 28.4682, lng: 77.0820 },
  "IFFCO Chowk": { lat: 28.4544, lng: 77.0728 },
  "HUDA City Centre": { lat: 28.4595, lng: 77.0726 },

  // Blue Line Main
  "Noida Electronic City": { lat: 28.5741, lng: 77.3565 },
  "Noida Sector 62": { lat: 28.6074, lng: 77.3556 },
  "Noida Sector 59": { lat: 28.6096, lng: 77.3536 },
  "Noida Sector 61": { lat: 28.6067, lng: 77.3512 },
  "Noida Sector 52": { lat: 28.5897, lng: 77.3620 },
  "Noida Sector 34": { lat: 28.5760, lng: 77.3625 },
  "Noida City Centre": { lat: 28.5748, lng: 77.3564 },
  "Golf Course": { lat: 28.5717, lng: 77.3475 },
  "Botanical Garden": { lat: 28.5636, lng: 77.3348 },
  "Noida Sector 18": { lat: 28.5701, lng: 77.3264 },
  "Noida Sector 16": { lat: 28.5763, lng: 77.3162 },
  "Noida Sector 15": { lat: 28.5836, lng: 77.3117 },
  "New Ashok Nagar": { lat: 28.6090, lng: 77.2993 },
  "Mayur Vihar Extension": { lat: 28.6103, lng: 77.2966 },
  "Mayur Vihar-I": { lat: 28.6083, lng: 77.2917 },
  "Akshardham": { lat: 28.6127, lng: 77.2771 },
  "Yamuna Bank": { lat: 28.6201, lng: 77.2785 },
  "Indraprastha": { lat: 28.6274, lng: 77.2453 },
  "Supreme Court (Pragati Maidan)": { lat: 28.6222, lng: 77.2432 },
  "Mandi House": { lat: 28.6264, lng: 77.2344 },
  "Barakhamba Road": { lat: 28.6318, lng: 77.2271 },
  "Ramakrishna Ashram Marg": { lat: 28.6396, lng: 77.2067 },
  "Jhandewalan": { lat: 28.6434, lng: 77.1989 },
  "Karol Bagh": { lat: 28.6510, lng: 77.1905 },
  "Rajendra Place": { lat: 28.6426, lng: 77.1826 },
  "Patel Nagar": { lat: 28.6494, lng: 77.1729 },
  "Shadipur": { lat: 28.6522, lng: 77.1625 },
  "Kirti Nagar": { lat: 28.6584, lng: 77.1493 },
  "Moti Nagar": { lat: 28.6603, lng: 77.1397 },
  "Ramesh Nagar": { lat: 28.6428, lng: 77.1331 },
  "Rajouri Garden": { lat: 28.6410, lng: 77.1207 },
  "Tagore Garden": { lat: 28.6418, lng: 77.1118 },
  "Subhash Nagar": { lat: 28.6367, lng: 77.0932 },
  "Tilak Nagar": { lat: 28.6375, lng: 77.0840 },
  "Janakpuri East": { lat: 28.6207, lng: 77.0867 },
  "Janakpuri West": { lat: 28.6214, lng: 77.0761 },
  "Uttam Nagar East": { lat: 28.6212, lng: 77.0658 },
  "Uttam Nagar West": { lat: 28.6201, lng: 77.0551 },
  "Nawada": { lat: 28.6081, lng: 77.0643 },
  "Dwarka Mor": { lat: 28.5995, lng: 77.0627 },
  "Dwarka": { lat: 28.5921, lng: 77.0589 },
  "Dwarka Sector 14": { lat: 28.5790, lng: 77.0571 },
  "Dwarka Sector 13": { lat: 28.5722, lng: 77.0571 },
  "Dwarka Sector 12": { lat: 28.5658, lng: 77.0571 },
  "Dwarka Sector 11": { lat: 28.5594, lng: 77.0571 },
  "Dwarka Sector 10": { lat: 28.5530, lng: 77.0571 },
  "Dwarka Sector 9": { lat: 28.5466, lng: 77.0584 },
  "Dwarka Sector 8": { lat: 28.5402, lng: 77.0584 },
  "Dwarka Sector 21": { lat: 28.5525, lng: 77.0584 },

  // Blue Branch (to Vaishali)
  "Laxmi Nagar": { lat: 28.6358, lng: 77.2767 },
  "Nirman Vihar": { lat: 28.6363, lng: 77.2922 },
  "Preet Vihar": { lat: 28.6424, lng: 77.2948 },
  "Karkar Duma": { lat: 28.6513, lng: 77.2950 },
  "Anand Vihar ISBT": { lat: 28.6469, lng: 77.3160 },
  "Kaushambi": { lat: 28.6452, lng: 77.3208 },
  "Vaishali": { lat: 28.6496, lng: 77.3402 },

  // Green Line
  "Brigadier Hoshiar Singh": { lat: 28.6845, lng: 77.1433 },
  "Ashok Park Main": { lat: 28.6867, lng: 77.1517 },
  "Satguru Ram Singh Marg": { lat: 28.6766, lng: 77.1717 },
  "Shivaji Park": { lat: 28.6562, lng: 77.1751 },
  "Madipur": { lat: 28.6506, lng: 77.1412 },
  "Paschim Vihar (East)": { lat: 28.6688, lng: 77.1048 },
  "Paschim Vihar (West)": { lat: 28.6665, lng: 77.0971 },
  "Peeragarhi": { lat: 28.6746, lng: 77.0878 },
  "Udyog Nagar": { lat: 28.6795, lng: 77.0686 },
  "Maharaja Surajmal Stadium": { lat: 28.6814, lng: 77.0594 },
  "Nangloi": { lat: 28.6805, lng: 77.0424 },
  "Nangloi Railway Station": { lat: 28.6807, lng: 77.0363 },
  "Rajdhani Park": { lat: 28.6834, lng: 77.0199 },
  "Mundka": { lat: 28.6836, lng: 77.0181 },
  "Mundka Industrial Area (MIA)": { lat: 28.6870, lng: 77.0134 },
  "Ghevra Metro Station": { lat: 28.6970, lng: 77.0027 },
  "Tikri Kalan": { lat: 28.7063, lng: 76.9912 },
  "Tikri Border": { lat: 28.7165, lng: 76.9784 },
  "Pandit Shree Ram Sharma": { lat: 28.7254, lng: 76.9684 },
  "Bahadurgarh City": { lat: 28.7312, lng: 76.9561 },

  // Violet Line
  "Lal Qila": { lat: 28.6562, lng: 77.2410 },
  "Jama Masjid": { lat: 28.6508, lng: 77.2338 },
  "Delhi Gate": { lat: 28.6437, lng: 77.2355 },
  "ITO": { lat: 28.6290, lng: 77.2419 },
  "Janpath": { lat: 28.6219, lng: 77.2199 },
  "Khan Market": { lat: 28.6000, lng: 77.2266 },
  "JLN Stadium": { lat: 28.5918, lng: 77.2338 },
  "Jangpura": { lat: 28.5846, lng: 77.2426 },
  "Lajpat Nagar": { lat: 28.5678, lng: 77.2431 },
  "Moolchand": { lat: 28.5644, lng: 77.2449 },
  "Kailash Colony": { lat: 28.5527, lng: 77.2426 },
  "Nehru Place": { lat: 28.5494, lng: 77.2502 },
  "Kalkaji Mandir": { lat: 28.5485, lng: 77.2585 },
  "Govindpuri": { lat: 28.5348, lng: 77.2731 },
  "Harkesh Nagar Okhla": { lat: 28.5306, lng: 77.2817 },
  "Jasola Apollo": { lat: 28.5314, lng: 77.2914 },
  "Sarita Vihar": { lat: 28.5298, lng: 77.3009 },
  "Mohan Estate": { lat: 28.4995, lng: 77.3040 },
  "Tughlakabad": { lat: 28.5073, lng: 77.2827 },
  "Badarpur Border": { lat: 28.4935, lng: 77.3041 },
  "Sarai": { lat: 28.4827, lng: 77.3084 },
  "NHPC Chowk": { lat: 28.4727, lng: 77.3138 },
  "Mewala Maharajpur": { lat: 28.4621, lng: 77.3184 },
  "Sector 28": { lat: 28.4518, lng: 77.3225 },
  "Badkal Mor": { lat: 28.4422, lng: 77.3262 },
  "Old Faridabad": { lat: 28.4305, lng: 77.3171 },
  "Neelam Chowk Ajronda": { lat: 28.4208, lng: 77.3095 },
  "Bata Chowk": { lat: 28.4119, lng: 77.3024 },
  "Escorts Mujesar": { lat: 28.4018, lng: 77.2950 },
  "Sant Surdas (Sihi)": { lat: 28.3921, lng: 77.2885 },
  "Raja Nahar Singh (Ballabhgarh)": { lat: 28.3814, lng: 77.2816 },

  // Pink Line
  "Majlis Park": { lat: 28.7243, lng: 77.1518 },
  "Shalimar Bagh": { lat: 28.7122, lng: 77.1643 },
  "Shakurpur": { lat: 28.6980, lng: 77.1427 },
  "Punjabi Bagh West": { lat: 28.6728, lng: 77.1312 },
  "ESI Hospital": { lat: 28.6659, lng: 77.1281 },
  "Mayapuri": { lat: 28.6429, lng: 77.1376 },
  "Naraina Vihar": { lat: 28.6339, lng: 77.1432 },
  "Delhi Cantt": { lat: 28.6169, lng: 77.1341 },
  "Durgabai Deshmukh South Campus": { lat: 28.6002, lng: 77.1371 },
  "Sir M Vishweshwaraiah Moti Bagh": { lat: 28.5975, lng: 77.1661 },
  "Bhikaji Cama Place": { lat: 28.5693, lng: 77.1883 },
  "Sarojini Nagar": { lat: 28.5753, lng: 77.1988 },
  "South Extension": { lat: 28.5689, lng: 77.2154 },
  "Vinobapuri": { lat: 28.5638, lng: 77.2386 },
  "Ashram": { lat: 28.5733, lng: 77.2561 },
  "Hazrat Nizamuddin": { lat: 28.5883, lng: 77.2504 },
  "Mayur Vihar Pocket 1": { lat: 28.6113, lng: 77.2906 },
  "Trilokpuri Sanjay Lake": { lat: 28.6174, lng: 77.2959 },
  "East Vinod Nagar Mayur Vihar-II": { lat: 28.6219, lng: 77.3024 },
  "Mandawali West Vinod Nagar": { lat: 28.6298, lng: 77.2983 },
  "IP Extension": { lat: 28.6368, lng: 77.2938 },
  "Karkarduma Court": { lat: 28.6558, lng: 77.2978 },
  "Krishna Nagar": { lat: 28.6619, lng: 77.2822 },
  "East Azad Nagar": { lat: 28.6670, lng: 77.2769 },
  "Jaffrabad": { lat: 28.6723, lng: 77.2812 },
  "Maujpur-Babarpur": { lat: 28.6769, lng: 77.2891 },
  "Gokulpuri": { lat: 28.6843, lng: 77.3002 },
  "Johri Enclave": { lat: 28.6896, lng: 77.3076 },
  "Shiv Vihar": { lat: 28.6954, lng: 77.3154 },

  // Magenta Line
  "Dabri Mor-Janakpuri South": { lat: 28.6119, lng: 77.0686 },
  "Dashrath Puri": { lat: 28.6063, lng: 77.0625 },
  "Palam": { lat: 28.6001, lng: 77.0554 },
  "Sadar Bazaar Cantonment": { lat: 28.5949, lng: 77.0896 },
  "Terminal 1 IGI Airport": { lat: 28.5575, lng: 77.1181 },
  "Shankar Vihar": { lat: 28.5532, lng: 77.1372 },
  "Vasant Vihar": { lat: 28.5589, lng: 77.1576 },
  "Munirka": { lat: 28.5559, lng: 77.1754 },
  "RK Puram": { lat: 28.5523, lng: 77.1832 },
  "IIT Delhi": { lat: 28.5464, lng: 77.1926 },
  "Panchsheel Park": { lat: 28.5411, lng: 77.2128 },
  "Chirag Delhi": { lat: 28.5382, lng: 77.2208 },
  "Greater Kailash": { lat: 28.5476, lng: 77.2391 },
  "Nehru Enclave": { lat: 28.5509, lng: 77.2502 },
  "Okhla NSIC": { lat: 28.5513, lng: 77.2733 },
  "Sukhdev Vihar": { lat: 28.5498, lng: 77.2855 },
  "Jamia Millia Islamia": { lat: 28.5606, lng: 77.2826 },
  "Okhla Vihar": { lat: 28.5488, lng: 77.2977 },
  "Jasola Vihar Shaheen Bagh": { lat: 28.5532, lng: 77.3089 },
  "Kalindi Kunj": { lat: 28.5572, lng: 77.3214 },
  "Okhla Bird Sanctuary": { lat: 28.5614, lng: 77.3265 },

  // Grey Line
  "Nangli": { lat: 28.5888, lng: 77.0287 },
  "Najafgarh": { lat: 28.6091, lng: 77.0015 },
  "Dhansa Bus Stand": { lat: 28.6138, lng: 76.9894 },

  // Orange Line (Airport Express)
  "Shivaji Stadium": { lat: 28.6404, lng: 77.2229 },
  "Dhaula Kuan": { lat: 28.5993, lng: 77.1602 },
  "Delhi Aerocity": { lat: 28.5501, lng: 77.1212 },
  "IGI Airport (T3)": { lat: 28.5562, lng: 77.0988 },
  "Yashobhoomi Dwarka Sector 25": { lat: 28.5423, lng: 77.0445 },

  // Aqua Line (Rapid Metro Gurgaon)
  "Phase 1": { lat: 28.4735, lng: 77.0858 },
  "Phase 2": { lat: 28.4695, lng: 77.0812 },
  "Phase 3": { lat: 28.4655, lng: 77.0766 },
  "Cyber City": { lat: 28.4947, lng: 77.0868 },
  "Moulsari Avenue": { lat: 28.4915, lng: 77.0824 },
  "Micromax Moulsari": { lat: 28.4885, lng: 77.0780 },
  "Vodafone Belvedere": { lat: 28.4856, lng: 77.0735 },
  "Rapid Metro": { lat: 28.4825, lng: 77.0690 },
  "DLF Phase 2 Rapid Metro": { lat: 28.4791, lng: 77.0645 },
  "Sikandarpur Rapid Metro": { lat: 28.4761, lng: 77.0600 }
};

function generateStationId(name: string): string {
  return name.toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--/g, '-');
}

async function seedCompleteData() {
  console.log('Starting comprehensive database seeding...');

  // Read the complete metro data
  const dataPath = path.join(__dirname, 'complete-metro-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data: CompleteMetroData = JSON.parse(rawData);

  // Clear existing data (in correct order due to foreign keys)
  console.log('Clearing existing data...');
  sqlite.exec('PRAGMA foreign_keys = OFF');
  sqlite.exec('DELETE FROM station_connections');
  sqlite.exec('DELETE FROM line_stations');
  sqlite.exec('DELETE FROM metro_stations');
  sqlite.exec('DELETE FROM metro_lines');
  sqlite.exec('PRAGMA foreign_keys = ON');

  // Insert lines
  console.log('Inserting metro lines...');
  const insertLine = sqlite.prepare(`
    INSERT INTO metro_lines (id, name, color, display_order)
    VALUES (?, ?, ?, ?)
  `);

  for (const line of data.lines) {
    insertLine.run(line.id, line.name, line.color, line.displayOrder);
    console.log(`  ✓ ${line.name} (${line.color})`);
  }

  // Insert stations and line relationships
  console.log('\nInserting stations...');
  const insertStation = sqlite.prepare(`
    INSERT OR IGNORE INTO metro_stations (id, name, latitude, longitude, is_interchange)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertLineStation = sqlite.prepare(`
    INSERT INTO line_stations (line_id, station_id, sequence_number, direction)
    VALUES (?, ?, ?, ?)
  `);

  let totalStations = 0;
  for (const [lineKey, stations] of Object.entries(data.stations)) {
    const lineId = lineKey.replace('Branch', '');
    console.log(`\n  Processing ${lineId} line:`);

    stations.forEach((station, index) => {
      const stationId = generateStationId(station.name);
      const coords = stationCoordinates[station.name] || { lat: 28.6, lng: 77.2 }; // Default to Delhi center

      // Insert station (ignore if duplicate from another line)
      insertStation.run(
        stationId,
        station.name,
        coords.lat,
        coords.lng,
        station.isInterchange ? 1 : 0
      );

      // Insert line-station relationship
      insertLineStation.run(
        lineId,
        stationId,
        index + 1,
        'forward'
      );

      totalStations++;
      if ((index + 1) % 10 === 0) {
        process.stdout.write(`    ${index + 1} stations... `);
      }
    });

    console.log(`    ✓ ${stations.length} stations added`);
  }

  console.log(`\n✅ Database seeding complete!`);
  console.log(`   Lines: ${data.lines.length}`);
  console.log(`   Total station records: ${totalStations}`);
  console.log(`   Unique stations: ~${Object.keys(stationCoordinates).length}`);
}

// Run the seed function
seedCompleteData()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  });
