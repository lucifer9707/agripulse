// js/csvParser.js
const CsvParser = {
    // parse CSV string to array of objects with numeric conversion
    parse(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) throw new Error('CSV must have headers + data');
        const headers = lines[0].split(',').map(h => h.trim());
        const required = ['soil_id', 'nitrogen', 'phosphorus', 'potassium', 'ph_level'];
        const missing = required.filter(r => !headers.includes(r));
        if (missing.length) throw new Error(`missing headers: ${missing.join(', ')}`);

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) continue; // malformed skip
            const obj = {};
            headers.forEach((h, idx) => {
                let val = values[idx];
                if (h === 'soil_id') obj[h] = val;
                else obj[h] = parseFloat(val) || 0;
            });
            rows.push(obj);
        }
        return rows; // array of soil records
    }
};

// make global
window.CsvParser = CsvParser;