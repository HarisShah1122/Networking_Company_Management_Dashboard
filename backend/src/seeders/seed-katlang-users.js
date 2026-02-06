require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Company, Customer, Area, Connection } = require('../models');

// All Katlang users data
const katlangUsers = [
  {
    username: "face536",
    payid: "290440",
    package: "5 Mbps",
    firstname: "Muhammad",
    lastname: "Fayaz",
    address: "qazi abad",
    city: "",
    mobile: "923425500045",
    expiration: "2/11/2026 12:00",
    created_on: "6/7/2025",
    owner: "katlang1"
  },
  {
    username: "face536",
    payid: "290440",
    package: "5 Mbps - 500 GB",
    firstname: "Muhammad",
    lastname: "Fayaz",
    address: "qazi abad",
    city: "",
    mobile: "923425500045",
    expiration: "2/11/2026 12:00",
    created_on: "6/7/2025",
    owner: "katlang1"
  },
  {
    username: "fiber530",
    payid: "",
    package: "5 Mbps",
    firstname: "Shaha",
    lastname: "Fahad",
    address: "konj",
    city: "",
    mobile: "923199518205",
    expiration: "3/3/2026 12:00",
    created_on: "5/17/2025",
    owner: "katlang1"
  },
  {
    username: "fiber530",
    payid: "",
    package: "5 Mbps - 500 GB",
    firstname: "Shaha",
    lastname: "Fahad",
    address: "konj",
    city: "",
    mobile: "923199518205",
    expiration: "3/3/2026 12:00",
    created_on: "5/17/2025",
    owner: "katlang1"
  },
  {
    username: "ktg_aamir",
    payid: "215240",
    package: "15-Mbps",
    firstname: "Aamir",
    lastname: "Khan",
    address: "Katlag bazar",
    city: "Mardan",
    mobile: "923444746196",
    expiration: "9/2/2025 12:00",
    created_on: "2/22/2021",
    owner: "katlang1"
  },
  {
    username: "officeuser",
    payid: "",
    package: "20 Mbps - 500GB",
    firstname: "Office",
    lastname: "Office",
    address: "Katti garhi Adda",
    city: "",
    mobile: "923444746196",
    expiration: "2/14/2026 12:00",
    created_on: "2/6/2025",
    owner: "katlang1"
  },
  {
    username: "pace001",
    payid: "214453",
    package: "10 Mbps - 500 GB",
    firstname: "Office",
    lastname: "User",
    address: "Katti garhi adda katlang mardan",
    city: "Mardan",
    mobile: "923469357558",
    expiration: "2/23/2026 12:00",
    created_on: "3/10/2021",
    owner: "katlang1"
  },
  {
    username: "pace002",
    payid: "213502",
    package: "3Mbps",
    firstname: "Imad",
    lastname: "Alam",
    address: "Katti garhi adda mardan",
    city: "Mardan",
    mobile: "923129318686",
    expiration: "3/2/2026 12:00",
    created_on: "3/11/2021",
    owner: "katlang1"
  },
  {
    username: "pace003",
    payid: "217650",
    package: "5 Mbps",
    firstname: "Usama",
    lastname: "Khan",
    address: "Kunj katlang mardan",
    city: "Mardan",
    mobile: "923109671075",
    expiration: "3/1/2026 12:00",
    created_on: "3/11/2021",
    owner: "katlang1"
  },
  {
    username: "pace003",
    payid: "217650",
    package: "5 Mbps - 500 GB",
    firstname: "Usama",
    lastname: "Khan",
    address: "Kunj katlang mardan",
    city: "Mardan",
    mobile: "923109671075",
    expiration: "3/1/2026 12:00",
    created_on: "3/11/2021",
    owner: "katlang1"
  },
  {
    username: "pace004",
    payid: "215617",
    package: "20 Mbps - 500GB",
    firstname: "Kamran",
    lastname: "Ali",
    address: "Shero dehry katlang mardan",
    city: "Mardan",
    mobile: "923129318686",
    expiration: "3/2/2026 12:00",
    created_on: "3/12/2021",
    owner: "katlang1"
  },
  {
    username: "pace005",
    payid: "212331",
    package: "3Mbps",
    firstname: "Sawar",
    lastname: "Khan",
    address: "Purana shero katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923338000028",
    expiration: "2/27/2026 12:00",
    created_on: "3/16/2021",
    owner: "katlang1"
  },
  {
    username: "pace006",
    payid: "213524",
    package: "10 Mbps - 500 GB",
    firstname: "Haris",
    lastname: "Khan",
    address: "Roshan kali Sheri katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923449177929",
    expiration: "3/1/2026 12:00",
    created_on: "3/23/2021",
    owner: "katlang1"
  },
  {
    username: "pace007",
    payid: "212652",
    package: "3Mbps",
    firstname: "Farooq",
    lastname: "Khan",
    address: "Pendaro katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923425661904",
    expiration: "9/2/2025 12:00",
    created_on: "3/23/2021",
    owner: "katlang1"
  },
  {
    username: "pace008",
    payid: "212510",
    package: "10 Mbps - 500 GB",
    firstname: "Farooq",
    lastname: "Sherali",
    address: "Zarqand banda katlang mardan",
    city: "Mardan",
    mobile: "923439991155",
    expiration: "3/3/2026 12:00",
    created_on: "3/25/2021",
    owner: "katlang1"
  },
  {
    username: "pace009",
    payid: "217690",
    package: "5 Mbps",
    firstname: "Sahib",
    lastname: "Ullah",
    address: "Tor gul banda pendaro",
    city: "Mardan",
    mobile: "923469305191",
    expiration: "3/1/2026 12:00",
    created_on: "3/24/2021",
    owner: "katlang1"
  },
  {
    username: "pace009",
    payid: "217690",
    package: "5 Mbps - 500 GB",
    firstname: "Sahib",
    lastname: "Ullah",
    address: "Tor gul banda pendaro",
    city: "Mardan",
    mobile: "923469305191",
    expiration: "3/1/2026 12:00",
    created_on: "3/24/2021",
    owner: "katlang1"
  },
  {
    username: "pace010",
    payid: "217985",
    package: "5 Mbps",
    firstname: "Sardar",
    lastname: "Hussain",
    address: "Gulab banda katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923408462967",
    expiration: "2/6/2026 12:00",
    created_on: "3/28/2021",
    owner: "katlang1"
  },
  {
    username: "pace010",
    payid: "217985",
    package: "5 Mbps - 500 GB",
    firstname: "Sardar",
    lastname: "Hussain",
    address: "Gulab banda katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923408462967",
    expiration: "2/6/2026 12:00",
    created_on: "3/28/2021",
    owner: "katlang1"
  },
  {
    username: "pace011",
    payid: "211396",
    package: "5 Mbps",
    firstname: "Muhammad",
    lastname: "Tariq",
    address: "Mashal khan kali katlang mardan",
    city: "Mardan",
    mobile: "923429196006",
    expiration: "3/1/2026 12:00",
    created_on: "4/2/2021",
    owner: "katlang1"
  },
  {
    username: "pace011",
    payid: "211396",
    package: "5 Mbps - 500 GB",
    firstname: "Muhammad",
    lastname: "Tariq",
    address: "Mashal khan kali katlang mardan",
    city: "Mardan",
    mobile: "923429196006",
    expiration: "3/1/2026 12:00",
    created_on: "4/2/2021",
    owner: "katlang1"
  },
  {
    username: "pace012",
    payid: "213856",
    package: "5 Mbps",
    firstname: "Mansoor",
    lastname: "Mandi",
    address: "Haji habib rasol korona shero dheri katlang mardan",
    city: "Mardan",
    mobile: "923469308288",
    expiration: "2/24/2026 12:00",
    created_on: "3/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace012",
    payid: "213856",
    package: "5 Mbps - 500 GB",
    firstname: "Mansoor",
    lastname: "Mandi",
    address: "Haji habib rasol korona shero dheri katlang mardan",
    city: "Mardan",
    mobile: "923469308288",
    expiration: "2/24/2026 12:00",
    created_on: "3/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace013",
    payid: "216978",
    package: "5 Mbps",
    firstname: "Muhammad",
    lastname: "Ihtisham",
    address: "Afzal khan banda katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923429198875",
    expiration: "3/3/2026 12:00",
    created_on: "3/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace013",
    payid: "216978",
    package: "5 Mbps - 500 GB",
    firstname: "Muhammad",
    lastname: "Ihtisham",
    address: "Afzal khan banda katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923429198875",
    expiration: "3/3/2026 12:00",
    created_on: "3/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace014",
    payid: "211652",
    package: "3Mbps",
    firstname: "Bahar",
    lastname: "Ali",
    address: "Roshan kalli katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923446677470",
    expiration: "2/7/2026 12:00",
    created_on: "4/2/2021",
    owner: "katlang1"
  },
  {
    username: "pace015",
    payid: "216438",
    package: "5 Mbps",
    firstname: "Muzam",
    lastname: "Shah",
    address: "Akber market katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923429797610",
    expiration: "3/1/2026 12:00",
    created_on: "3/25/2021",
    owner: "katlang1"
  },
  {
    username: "pace015",
    payid: "216438",
    package: "5 Mbps - 500 GB",
    firstname: "Muzam",
    lastname: "Shah",
    address: "Akber market katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923429797610",
    expiration: "3/1/2026 12:00",
    created_on: "3/25/2021",
    owner: "katlang1"
  },
  {
    username: "pace016",
    payid: "216420",
    package: "5 Mbps",
    firstname: "Imtiaz",
    lastname: "Khan",
    address: "Katti garhi adda",
    city: "Mardan",
    mobile: "923427707533",
    expiration: "3/2/2026 12:00",
    created_on: "3/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace016",
    payid: "216420",
    package: "5 Mbps - 500 GB",
    firstname: "Imtiaz",
    lastname: "Khan",
    address: "Katti garhi adda",
    city: "Mardan",
    mobile: "923427707533",
    expiration: "3/2/2026 12:00",
    created_on: "3/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace017",
    payid: "",
    package: "5 Mbps",
    firstname: "Shahid",
    lastname: "Iqbal",
    address: "purana shero mardan",
    city: "Mardan",
    mobile: "923451929020",
    expiration: "2/6/2026 12:00",
    created_on: "3/31/2021",
    owner: "katlang1"
  },
  {
    username: "pace017",
    payid: "",
    package: "5 Mbps - 500 GB",
    firstname: "Shahid",
    lastname: "Iqbal",
    address: "purana shero mardan",
    city: "Mardan",
    mobile: "923451929020",
    expiration: "2/6/2026 12:00",
    created_on: "3/31/2021",
    owner: "katlang1"
  },
  {
    username: "pace018",
    payid: "213804",
    package: "5 Mbps",
    firstname: "Muhammad",
    lastname: "Zeeshan",
    address: "Kunj katlang mardan",
    city: "Mardan",
    mobile: "923000925668",
    expiration: "3/1/2026 12:00",
    created_on: "3/31/2021",
    owner: "katlang1"
  },
  {
    username: "pace018",
    payid: "213804",
    package: "5 Mbps - 500 GB",
    firstname: "Muhammad",
    lastname: "Zeeshan",
    address: "Kunj katlang mardan",
    city: "Mardan",
    mobile: "923000925668",
    expiration: "3/1/2026 12:00",
    created_on: "3/31/2021",
    owner: "katlang1"
  },
  {
    username: "pace019",
    payid: "217007",
    package: "3Mbps",
    firstname: "Jaber",
    lastname: "Khan",
    address: "katlang mardan",
    city: "Mardan",
    mobile: "923005727399",
    expiration: "7/23/2025 12:00",
    created_on: "5/7/2021",
    owner: "katlang1"
  },
  {
    username: "pace021",
    payid: "214571",
    package: "5 Mbps",
    firstname: "Usman",
    lastname: "Khan",
    address: "kotki katlang mardan",
    city: "Mardan",
    mobile: "923335550005",
    expiration: "4/1/2026 12:00",
    created_on: "6/1/2021",
    owner: "katlang1"
  },
  {
    username: "pace021",
    payid: "214571",
    package: "5 Mbps - 500 GB",
    firstname: "Usman",
    lastname: "Khan",
    address: "kotki katlang mardan",
    city: "Mardan",
    mobile: "923335550005",
    expiration: "4/1/2026 12:00",
    created_on: "6/1/2021",
    owner: "katlang1"
  },
  {
    username: "pace022",
    payid: "216865",
    package: "5 Mbps",
    firstname: "Murad",
    lastname: "Ali",
    address: "Tawas khan banda katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923499082987",
    expiration: "3/3/2026 12:00",
    created_on: "6/1/2021",
    owner: "katlang1"
  },
  {
    username: "pace022",
    payid: "216865",
    package: "5 Mbps - 500 GB",
    firstname: "Murad",
    lastname: "Ali",
    address: "Tawas khan banda katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923499082987",
    expiration: "3/3/2026 12:00",
    created_on: "6/1/2021",
    owner: "katlang1"
  },
  {
    username: "pace023",
    payid: "219281",
    package: "10 Mbps - 500 GB",
    firstname: "Fazli",
    lastname: "Amin",
    address: "Tawas khan banda katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923404800704",
    expiration: "3/1/2026 12:00",
    created_on: "6/1/2021",
    owner: "katlang1"
  },
  {
    username: "pace024",
    payid: "217819",
    package: "5 Mbps",
    firstname: "M",
    lastname: "Nawaz",
    address: "Purana shero katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923339860875",
    expiration: "3/2/2026 12:00",
    created_on: "6/1/2021",
    owner: "katlang1"
  },
  {
    username: "pace024",
    payid: "217819",
    package: "5 Mbps - 500 GB",
    firstname: "M",
    lastname: "Nawaz",
    address: "Purana shero katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923339860875",
    expiration: "3/2/2026 12:00",
    created_on: "6/1/2021",
    owner: "katlang1"
  },
  {
    username: "pace025",
    payid: "219401",
    package: "20 Mbps - 500GB",
    firstname: "Sajjad",
    lastname: "Muhmmand",
    address: "Lahti kali katlang mardan",
    city: "Mardan",
    mobile: "923149622222",
    expiration: "2/6/2026 12:00",
    created_on: "6/2/2021",
    owner: "katlang1"
  },
  {
    username: "pace026",
    payid: "218831",
    package: "10 Mbps - 500 GB",
    firstname: "Hilal",
    lastname: "Shah",
    address: "Jamal khan dhand katti garhi",
    city: "Mardan",
    mobile: "923345505056",
    expiration: "3/2/2026 12:00",
    created_on: "6/14/2021",
    owner: "katlang1"
  },
  {
    username: "pace027",
    payid: "213744",
    package: "5 Mbps",
    firstname: "Zohaib",
    lastname: "Khan",
    address: "Shah zamir banda katti garhi",
    city: "Mardan",
    mobile: "923439185854",
    expiration: "3/1/2026 12:00",
    created_on: "6/15/2021",
    owner: "katlang1"
  },
  {
    username: "pace027",
    payid: "213744",
    package: "5 Mbps - 500 GB",
    firstname: "Zohaib",
    lastname: "Khan",
    address: "Shah zamir banda katti garhi",
    city: "Mardan",
    mobile: "923439185854",
    expiration: "3/1/2026 12:00",
    created_on: "6/15/2021",
    owner: "katlang1"
  },
  {
    username: "pace028",
    payid: "217121",
    package: "5 Mbps",
    firstname: "Naveed",
    lastname: "Ali",
    address: "Salak katti garhi mardan",
    city: "Mardan",
    mobile: "923469336880",
    expiration: "3/3/2026 12:00",
    created_on: "6/25/2021",
    owner: "katlang1"
  },
  {
    username: "pace028",
    payid: "217121",
    package: "5 Mbps - 500 GB",
    firstname: "Naveed",
    lastname: "Ali",
    address: "Salak katti garhi mardan",
    city: "Mardan",
    mobile: "923469336880",
    expiration: "3/3/2026 12:00",
    created_on: "6/25/2021",
    owner: "katlang1"
  },
  {
    username: "pace029",
    payid: "",
    package: "5 Mbps",
    firstname: "Tariq",
    lastname: "Shah",
    address: "Pendaro gujar main kalli",
    city: "Mardan",
    mobile: "923369136772",
    expiration: "3/1/2026 12:00",
    created_on: "7/7/2021",
    owner: "katlang1"
  },
  {
    username: "pace029",
    payid: "",
    package: "5 Mbps - 500 GB",
    firstname: "Tariq",
    lastname: "Shah",
    address: "Pendaro gujar main kalli",
    city: "Mardan",
    mobile: "923369136772",
    expiration: "3/1/2026 12:00",
    created_on: "7/7/2021",
    owner: "katlang1"
  },
  {
    username: "pace030",
    payid: "217746",
    package: "3Mbps",
    firstname: "Ismail",
    lastname: "Khan",
    address: "katti garhi adda",
    city: "Mardan",
    mobile: "923493564094",
    expiration: "2/6/2026 12:00",
    created_on: "7/24/2021",
    owner: "katlang1"
  },
  {
    username: "pace031",
    payid: "",
    package: "5 Mbps",
    firstname: "Latif",
    lastname: "Ullah",
    address: "Shamozie katlang mardan",
    city: "Mardan",
    mobile: "923453345522",
    expiration: "2/6/2026 12:00",
    created_on: "8/3/2021",
    owner: "katlang1"
  },
  {
    username: "pace031",
    payid: "",
    package: "5 Mbps - 500 GB",
    firstname: "Latif",
    lastname: "Ullah",
    address: "Shamozie katlang mardan",
    city: "Mardan",
    mobile: "923453345522",
    expiration: "2/6/2026 12:00",
    created_on: "8/3/2021",
    owner: "katlang1"
  },
  {
    username: "pace032",
    payid: "276072",
    package: "10 Mbps - 500 GB",
    firstname: "Nadeem",
    lastname: "Shah",
    address: "Badar Badar",
    city: "Mardan",
    mobile: "923325900009",
    expiration: "2/5/2026 12:00",
    created_on: "7/27/2021",
    owner: "katlang1"
  },
  {
    username: "pace033",
    payid: "219986",
    package: "20 Mbps - 500GB",
    firstname: "Raees",
    lastname: "Khan",
    address: "Lakhti kalli katlang mardan",
    city: "Mardan",
    mobile: "923338287033",
    expiration: "3/1/2026 12:00",
    created_on: "8/4/2021",
    owner: "katlang1"
  },
  {
    username: "pace034",
    payid: "",
    package: "5 Mbps",
    firstname: "Syed",
    lastname: "Talha",
    address: "Shah Ramzan banda",
    city: "Mardan",
    mobile: "923418527345",
    expiration: "2/1/2026 12:00",
    created_on: "8/15/2021",
    owner: "katlang1"
  },
  {
    username: "pace034",
    payid: "",
    package: "5 Mbps - 500 GB",
    firstname: "Syed",
    lastname: "Talha",
    address: "Shah Ramzan banda",
    city: "Mardan",
    mobile: "923418527345",
    expiration: "2/1/2026 12:00",
    created_on: "8/15/2021",
    owner: "katlang1"
  },
  {
    username: "pace035",
    payid: "",
    package: "5 Mbps",
    firstname: "Syed",
    lastname: "Amir",
    address: "Shah Shamozie katlang mardan",
    city: "Mardan",
    mobile: "923469896602",
    expiration: "2/11/2026 12:00",
    created_on: "9/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace035",
    payid: "",
    package: "5 Mbps - 500 GB",
    firstname: "Syed",
    lastname: "Amir",
    address: "Shah Shamozie katlang mardan",
    city: "Mardan",
    mobile: "923469896602",
    expiration: "2/11/2026 12:00",
    created_on: "9/26/2021",
    owner: "katlang1"
  },
  {
    username: "pace036",
    payid: "251112",
    package: "5 Mbps",
    firstname: "Anwar",
    lastname: "Khan",
    address: "kunj katlang mardan",
    city: "Mardan",
    mobile: "923469334318",
    expiration: "4/1/2026 12:00",
    created_on: "10/9/2021",
    owner: "katlang1"
  },
  {
    username: "pace036",
    payid: "251112",
    package: "5 Mbps - 500 GB",
    firstname: "Anwar",
    lastname: "Khan",
    address: "kunj katlang mardan",
    city: "Mardan",
    mobile: "923469334318",
    expiration: "4/1/2026 12:00",
    created_on: "10/9/2021",
    owner: "katlang1"
  },
  {
    username: "pace037",
    payid: "",
    package: "5 Mbps",
    firstname: "Shakoor",
    lastname: "Khan",
    address: "Bagh Kali katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923005743805",
    expiration: "2/14/2026 12:00",
    created_on: "10/29/2021",
    owner: "katlang1"
  },
  {
    username: "pace037",
    payid: "",
    package: "5 Mbps - 500 GB",
    firstname: "Shakoor",
    lastname: "Khan",
    address: "Bagh Kali katti garhi katlang mardan",
    city: "Mardan",
    mobile: "923005743805",
    expiration: "2/14/2026 12:00",
    created_on: "10/29/2021",
    owner: "katlang1"
  },
  {
    username: "pace038",
    payid: "",
    package: "20 Mbps - 500GB",
    firstname: "Muhammad",
    lastname: "Ibrahim",
    address: "Lakhti kali katlang",
    city: "Mardan",
    mobile: "923455934054",
    expiration: "2/7/2026 12:00",
    created_on: "1/18/2022",
    owner: "katlang1"
  }
];

async function seedKatlangUsers() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({ alter: false });
    console.log('Models synced');

    // Create or find PACE Telecom company
    console.log('Creating PACE Telecom company...');
    let paceCompany = await Company.findOne({ where: { name: 'PACE Telecom' } });
    
    if (!paceCompany) {
      paceCompany = await Company.create({
        id: uuidv4(),
        name: 'PACE Telecom',
        email: 'info@pacetelecom.com',
        company_id: `ISP-${Date.now()}`,
        status: 'active'
      });
      console.log('PACE Telecom company created');
    } else {
      console.log('PACE Telecom company found');
    }

    // Create or find Katlang area
    console.log('Finding Katlang area...');
    let katlangArea = await Area.findOne({ where: { name: 'Katlang' } });
    
    if (!katlangArea) {
      katlangArea = await Area.create({
        id: uuidv4(),
        name: 'Katlang',
        code: 'KATLANG',
        description: 'Katlang area - Mardan District',
        company_id: paceCompany.id
      });
      console.log('Katlang area created');
    } else {
      console.log('Katlang area found');
    }

    console.log(`Starting to seed ${katlangUsers.length} Katlang users...`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const userData of katlangUsers) {
      try {
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ 
          where: { pace_user_id: userData.username } 
        });

        if (existingCustomer) {
          console.log(`⚠️  Customer with username ${userData.username} already exists, skipping...`);
          skipCount++;
          continue;
        }

        // Create customer
        const customer = await Customer.create({
          id: uuidv4(),
          name: `${userData.firstname} ${userData.lastname}`,
          phone: userData.mobile,
          address: userData.address,
          pace_user_id: userData.username,
          company_id: paceCompany.id,
          status: 'active'
        });

        // Create connection for the customer
        await Connection.create({
          id: uuidv4(),
          customer_id: customer.id,
          connection_type: userData.package,
          installation_date: new Date(userData.created_on),
          activation_date: new Date(userData.created_on),
          status: 'completed',
          company_id: paceCompany.id,
          notes: `Package: ${userData.package}, Expiration: ${userData.expiration}, PayID: ${userData.payid || 'N/A'}`
        });

        console.log(`✅ Created customer: ${userData.firstname} ${userData.lastname} (${userData.username})`);
        successCount++;

      } catch (error) {
        console.log(`❌ Error creating user ${userData.username}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Total users processed: ${katlangUsers.length}`);
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`⚠️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\nAll Katlang users have been processed!');

    process.exit(0);
  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

seedKatlangUsers();
