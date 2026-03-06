// js/uiController.js
// mostly vue handles ui; this is a small helper for file reads (can be merged)
const UiController = {
    readCSVFile(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const rows = CsvParser.parse(e.target.result);
                callback(null, rows);
            } catch (err) {
                callback(err, null);
            }
        };
        reader.onerror = () => callback(new Error('file read failed'), null);
        reader.readAsText(file);
    }
};
window.UiController = UiController;