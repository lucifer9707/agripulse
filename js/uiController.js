window.UiController = {
    readCSVFile(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const rows = window.CsvParser.parse(e.target.result);
                callback(null, rows);
            } catch (err) {
                callback(err, null);
            }
        };
        reader.onerror = () => callback(new Error('File read failed'), null);
        reader.readAsText(file);
    }
};