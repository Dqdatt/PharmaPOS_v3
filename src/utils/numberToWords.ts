export const docTienBangChu = (so: number): string => {
  if (so === 0) return "Không đồng";
  const chuSo = ["khong", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  
  const docBlock = (soBlock: number) => {
    let ketQua = "";
    let tram = Math.floor(soBlock / 100);
    let chuc = Math.floor((soBlock % 100) / 10);
    let donVi = soBlock % 10;
    
    if (tram > 0) {
      ketQua += chuSo[tram] + " trăm ";
      if (chuc === 0 && donVi > 0) ketQua += "lẻ ";
    }
    if (chuc === 1) ketQua += "mười ";
    else if (chuc > 1) ketQua += chuSo[chuc] + " mươi ";
    
    if (donVi === 1 && chuc > 1) ketQua += "mốt ";
    else if (donVi === 5 && chuc > 0) ketQua += "lăm ";
    else if (donVi > 0 && !(chuc === 1 && donVi === 1))
      ketQua += chuSo[donVi] + " ";
      
    return ketQua.trim();
  };
  
  let str = so.toString();
  let blocks = ["", "ngàn", "triệu", "tỷ"];
  let result = [];
  let index = 0;
  
  while (str.length > 0) {
    let blockVal = parseInt(str.slice(-3), 10);
    str = str.slice(0, -3);
    if (blockVal > 0) {
      result.unshift(docBlock(blockVal) + " " + blocks[index]);
    } else if (index === 3) {
      result.unshift(blocks[index]);
    }
    index++;
  }
  
  let finalStr = result.join(" ").trim().replace(/\s+/g, " ") + " đồng";
  finalStr = finalStr.replace(/khong/g, "không");
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
};
