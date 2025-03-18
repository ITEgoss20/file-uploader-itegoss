import { useEffect, useState } from "react";

const FileUploader = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [newInsertedRecords, setNewInsertedRecords] = useState([]);
  const [missingExcelRecords, setMissingExcelRecords] = useState([]);

  useEffect(() => {
    const storedRecords = JSON.parse(localStorage.getItem("newRecords")) || [];
    setNewInsertedRecords(storedRecords);
    const missingExcelRecords =
      JSON.parse(localStorage.getItem("missingRecords")) || [];
    setMissingExcelRecords(missingExcelRecords);
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "https://backend-jtl6.onrender.com/api/upload-and-compare",
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await response.json();

      if (response.ok) {
        setMessage(
          `File uploaded successfully! ${result.recordsInserted} records inserted.`
        );

        // Fetch existing records from localStorage
        const existingNewRecords =
          JSON.parse(localStorage.getItem("newRecords")) || [];
        const existingMissingRecords =
          JSON.parse(localStorage.getItem("missingRecords")) || [];

        // Merge new records, ensuring uniqueness
        const updatedNewRecords = [
          ...new Map(
            [...existingNewRecords, ...result.insertedRecords].map((item) => [
              item.scan_code,
              item,
            ])
          ).values(),
        ];

        const updatedMissingRecords = [
          ...new Map(
            [...existingMissingRecords, ...result.missingRecords].map(
              (item) => [item.scan_code, item]
            )
          ).values(),
        ];

        // Update state & store in localStorage
        setNewInsertedRecords(updatedNewRecords);
        setMissingExcelRecords(updatedMissingRecords);
        localStorage.setItem("newRecords", JSON.stringify(updatedNewRecords));
        localStorage.setItem(
          "missingRecords",
          JSON.stringify(updatedMissingRecords)
        );

        // **Open WhatsApp link if available**
        if (result.whatsappLink) {
          window.location.href = result.whatsappLink; // Open WhatsApp chat
        }
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setMessage(""); // Clear message when removing file

    // Reset the file input field to ensure change detection
    document.getElementById("file").value = "";
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">File Uploader</h1>
      <p className="text-lg mb-6">Upload your file here</p>
      <div className="bg-white relative p-6 rounded-lg shadow-lg text-black h-52 w-80 flex flex-col items-center">
        <div className="mt-8 w-full">
          <input
            id="file"
            type="file"
            className="mb-4 border cursor-pointer p-2 rounded w-full hidden"
            onChange={handleFileChange}
          />
          {!file && (
            <label
              className="mb-4 border cursor-pointer p-2 rounded w-full block text-center"
              htmlFor="file"
            >
              Choose File
            </label>
          )}
          {file && (
            <p className="text-sm text-gray-700 mb-2 text-center">
              Selected: {file.name}
            </p>
          )}
        </div>
        {file && (
          <button
            className="absolute top-0 right-3 text-3xl rotate-45"
            onClick={handleRemoveFile}
          >
            +
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded w-full hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
        {message && (
          <p
            className={`mt-4 text-sm text-justify ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Table for sr and scan_code */}
      <div className="lg:flex lg:justify-center w-full lg:space-x-8">
        <div className="lg:w-[30%]">
          {newInsertedRecords.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-3 text-center">
                Newly Stock (In)
              </h2>
              <table className="min-w-full bg-white border text-black border-gray-300 shadow-md">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">Sr</th>
                    <th className="py-2 px-4 border">Scan Code</th>
                  </tr>
                </thead>
                <tbody>
                  {newInsertedRecords.map((record, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-4 border text-black">
                        {record.sr}
                      </td>
                      <td className="py-2 px-4 border text-black">
                        {record.scan_code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="lg:w-[30%]">
          {missingExcelRecords.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-3 text-center">
                Stock Sold (Out)
              </h2>
              <table className="min-w-full bg-white border text-black border-gray-300 shadow-md">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">Sr</th>
                    <th className="py-2 px-4 border">Scan Code</th>
                  </tr>
                </thead>
                <tbody>
                  {missingExcelRecords.map((record, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-4 border text-black">
                        {record.sr}
                      </td>
                      <td className="py-2 px-4 border text-black">
                        {record.scan_code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FileUploader;
