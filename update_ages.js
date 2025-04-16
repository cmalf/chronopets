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
    console.log('Starting updateAgesAndReadme function...');
    try {
        console.log('Attempting to read ages.json...');
        const dataBuffer = await fs.readFile(path.resolve(__dirname, DATA_FILE));
        const agesData = JSON.parse(dataBuffer.toString());
        console.log('Successfully read ages.json:', agesData);

        console.log('Attempting to read README.md...');
        const readmePath = path.resolve(__dirname, README_FILE);
        let readmeContent = await fs.readFile(readmePath, 'utf8');
        console.log('Successfully read README.md (first 50 chars):', readmeContent.substring(0, 50));

        const now = new Date();
        const updateTimestamp = now.toLocaleString('en-US', { timeZone: 'Asia/Makassar', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }) + ' (Denpasar, WITA Time (UTC+8))';
        console.log('Generated timestamp:', updateTimestamp);

        const ageReplacements = {};

        if (agesData.categories) {
            console.log('Processing categories...');
            for (const category in agesData.categories) {
                const pets = agesData.categories[category];
                for (const pet of pets) {
                    const birthDate = pet.date_of_birth;
                    if (birthDate && pet.name) {
                        pet.age = await calculateAge(birthDate);
                        const ageString = `${pet.age.years} years, ${pet.age.months} months, ${pet.age.days} days, ${pet.age.hours} hours`;
                        ageReplacements[pet.name] = ageString;
                        console.log(`Calculated age for ${pet.name}:`, ageString);
                    }
                }
            }
        }

        // Update the specific age lines in README.md
        console.log('Attempting to update age lines in README.md...');
        let updatedReadmeContent = readmeContent;
        for (const name in ageReplacements) {
            const regex = new RegExp(`- ${name} \\(Age: .*?\\)`, 'g');
            updatedReadmeContent = updatedReadmeContent.replace(regex, `- ${name} (Age: ${ageReplacements[name]})`);
            console.log(`Replaced age for ${name} in README content.`);
        }

        // Update the timestamp line more specifically
        console.log('Attempting to update timestamp in README.md...');
        const timestampRegex = /(> Updates Ages :)\s*\n(?:## Last updated: .*?\n\n)?/i;
        const newTimestampLine = `> Updates Ages :\n\n## Last updated: ${updateTimestamp}\n\n`;

        updatedReadmeContent = updatedReadmeContent.replace(timestampRegex, newTimestampLine);
        console.log('Replaced timestamp in README content.');

        console.log('Attempting to write updated ages.json...');
        await fs.writeFile(path.resolve(__dirname, DATA_FILE), JSON.stringify(agesData, null, 2));
        console.log('Successfully wrote to ages.json.');

        console.log('Attempting to write updated README.md...');
        await fs.writeFile(path.resolve(__dirname, README_FILE), updatedReadmeContent, 'utf8').catch(err => {
            console.error('Error writing to README.md:', err);
        });
        console.log('Attempt to write to README.md completed.');

    } catch (error) {
        console.error('Error in updateAgesAndReadme:', error);
    }
    console.log('Finished updateAgesAndReadme function.');
}

updateAgesAndReadme();
