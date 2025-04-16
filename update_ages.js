const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = 'ages.json';
const README_FILE = 'README.md';

async function calculateAge(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  const diffInMilliseconds = today.getTime() - birthDate.getTime();

  const millisecondsPerHour = 1000 * 60 * 60;
  const millisecondsPerDay = millisecondsPerHour * 24;
  const millisecondsPerMonth = millisecondsPerDay * 30.44;
  const millisecondsPerYear = millisecondsPerDay * 365.25;

  const years = Math.floor(diffInMilliseconds / millisecondsPerYear);
  const remainingMillisecondsAfterYears = diffInMilliseconds % millisecondsPerYear;

  const months = Math.floor(remainingMillisecondsAfterYears / millisecondsPerMonth);
  const remainingMillisecondsAfterMonths = remainingMillisecondsAfterYears % millisecondsPerMonth;

  const days = Math.floor(remainingMillisecondsAfterMonths / millisecondsPerDay);
  const hours = Math.floor((remainingMillisecondsAfterMonths % millisecondsPerDay) / millisecondsPerHour);

  return { years, months, days, hours };
}

async function updateAgesAndReadme() {
  try {
    const dataBuffer = await fs.readFile(path.resolve(__dirname, DATA_FILE));
    const agesData = JSON.parse(dataBuffer.toString());

    let readmeContent = await fs.readFile(path.resolve(__dirname, README_FILE), 'utf8');
    const now = new Date();
    const updateTimestamp = now.toLocaleString('en-US', { timeZone: 'Asia/Makassar', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }) + ' (Denpasar, WITA Time (UTC+8))';

    const ageReplacements = {};

    if (agesData.categories) {
      for (const category in agesData.categories) {
        const pets = agesData.categories[category];
        for (const pet of pets) {
          const birthDate = pet.date_of_birth;
          if (birthDate && pet.name) {
            pet.age = await calculateAge(birthDate);
            const ageString = `${pet.age.years} years, ${pet.age.months} months, ${pet.age.days} days, ${pet.age.hours} hours`;
            ageReplacements[pet.name] = ageString;
          }
        }
      }
    }

    // Update the specific age lines in README.md
    for (const name in ageReplacements) {
      const regex = new RegExp(`- ${name} \\(Age: .*?\\)`, 'g');
      readmeContent = readmeContent.replace(regex, `- ${name} (Age: ${ageReplacements[name]})`);
    }

    // Update the timestamp line more specifically
    const timestampRegex = /(> Updates Ages :)\s*\n(?:## Last updated: .*?\n\n)?/i;
    const newTimestampLine = `> Updates Ages :\n\n## Last updated: ${updateTimestamp}\n\n`;

    readmeContent = readmeContent.replace(timestampRegex, newTimestampLine);

    await fs.writeFile(path.resolve(__dirname, DATA_FILE), JSON.stringify(agesData, null, 2));
    await fs.writeFile(path.resolve(__dirname, README_FILE), readmeContent, 'utf8');

  } catch (error) {
    console.error('Error updating ages and README:', error);
  }
}

updateAgesAndReadme();