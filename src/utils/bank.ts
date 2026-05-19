export const bankInfo = {
  bankId: "970437",
  accountNo: "045704070016757",
  accountName: "BENH VIEN DA KHOA BUU DIEN",
  description: " CK TIEN THUOC CS1",
};

export const formatQRText = (str: string) => {
  if (!str) return "";
  let result = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  result = result.replace(/đ/g, "d").replace(/Đ/g, "D");
  return result.toUpperCase().trim();
};
