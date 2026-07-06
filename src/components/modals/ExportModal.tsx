import { useState } from "react";
import { showNotification } from "../../utils/toast";
import { usePos, ExportOrder } from "../../contexts/PosContext";
import ProductAutocomplete from "../ProductAutocomplete";

interface ExportRow {
  productId: number | "";
  qty: number;
  price: number;
}

export default function ExportModal({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: ExportOrder;
}) {
  const {
    products,
    currentUser,
    addExportOrderToDB,
    updateExportOrderInDB,
    formatPrice,
    getNow,
    getStock,
  } = usePos();

  const [recipientName, setRecipientName] = useState(
    initialData?.recipientName || "",
  );
  const [recipientPhone, setRecipientPhone] = useState(
    initialData?.recipientPhone || "",
  );
  const [customerAddress, setCustomerAddress] = useState(
    initialData?.customerAddress || "",
  );
  const [status, setStatus] = useState<ExportOrder["status"]>(
    initialData?.status || "exported",
  );
  const [note, setNote] = useState(initialData?.note || "");
  const [otherCosts, setOtherCosts] = useState<number>(
    initialData?.otherCosts || 0,
  );
  const [otherMedsFee, setOtherMedsFee] = useState<number>(
    initialData?.otherMedsFee || 0,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    initialData?.paymentMethod || "cash",
  );

  const [items, setItems] = useState<ExportRow[]>(
    initialData
      ? initialData.items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          price: i.price,
        }))
      : [{ productId: "", qty: 1, price: 0 }],
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const addRow = () =>
    setItems((prev) => [...prev, { productId: "", qty: 1, price: 0 }]);

  const removeRow = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (
    idx: number,
    field: keyof ExportRow,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        if (field === "productId") {
          const p = products.find((x) => x.id === Number(value));
          return {
            ...row,
            productId: Number(value),
            price: p ? p.sellPrice : 0,
            qty: 1,
          };
        }
        return { ...row, [field]: Number(value) || 0 };
      }),
    );
  };

  const goodsTotal = items.reduce(
    (s, i) => s + (i.qty || 0) * (i.price || 0),
    0,
  );
  const totalCalc = goodsTotal + otherCosts + otherMedsFee;

  const saveOrder = async () => {
    if (isProcessing) return;
    if (!recipientName.trim()) {
      showNotification("Vui lòng nhập tên người nhận!", "error");
      return;
    }

    const validItems = items.filter((i) => i.productId !== "" && i.qty > 0);
    if (validItems.length === 0) {
      showNotification("Vui lòng chọn ít nhất 1 sản phẩm hợp lệ!", "error");
      return;
    }

    // Check stock if status is NOT returned
    if (status !== "returned") {
      for (const item of validItems) {
        const p = products.find((x) => x.id === item.productId);
        if (p) {
          let currentStock = getStock(p);
          // If editing and order was previously active (not returned), add back old qty before checking
          if (initialData && initialData.status !== "returned") {
            const oldItem = initialData.items.find((i) => i.productId === p.id);
            if (oldItem) {
              currentStock += oldItem.qty;
            }
          }
          if (currentStock < item.qty) {
            showNotification(
              `Sản phẩm ${p.name} không đủ tồn kho (Còn: ${currentStock})!`,
              "error",
            );
            return;
          }
        }
      }
    }

    const enrichedItems = validItems.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      return {
        productId: i.productId as number,
        name: p?.name || "",
        unit: p?.unit || "",
        qty: i.qty,
        price: i.price,
      };
    });

    const orderId = initialData
      ? initialData.id
      : "XK" + Date.now().toString().slice(-6);
    const newOrder: ExportOrder = {
      id: orderId,
      date: initialData ? initialData.date : getNow(true),
      recipientName,
      recipientPhone,
      customerAddress,
      status,
      note,
      items: enrichedItems,
      total: totalCalc,
      otherCosts,
      otherMedsFee,
      paymentMethod,
      employeeName: initialData
        ? initialData.employeeName
        : currentUser?.name || "Nhân viên",
    };

    // Calculate new stock (totalOut)
    const productsToUpdate = products.map((p) => {
      let newTotalOut = p.totalOut;

      // Revert old quantities if it was previously active (not returned)
      if (initialData && initialData.status !== "returned") {
        const oldItem = initialData.items.find((i) => i.productId === p.id);
        if (oldItem) newTotalOut -= oldItem.qty;
      }

      // Apply new quantities if new status is active (not returned)
      if (status !== "returned") {
        const newItem = enrichedItems.find((i) => i.productId === p.id);
        if (newItem) newTotalOut += newItem.qty;
      }

      if (newTotalOut !== p.totalOut) {
        return { ...p, totalOut: newTotalOut };
      }
      return p;
    });

    setIsProcessing(true);
    try {
      if (initialData) {
        await updateExportOrderInDB(newOrder, productsToUpdate);
        showNotification(`Cập nhật đơn xuất ${orderId} thành công!`, "success");
      } else {
        await addExportOrderToDB(newOrder, productsToUpdate);
        showNotification(`Tạo đơn xuất ${orderId} thành công!`, "success");
      }
      onClose();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(
        `Có lỗi xảy ra khi lưu đơn xuất! Chi tiết: ${errMsg}`,
        "error",
      );
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {initialData
              ? `Sửa Đơn Xuất Kho: ${initialData.id}`
              : "Tạo Đơn Xuất Kho Mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">
                NGƯỜI NHẬN / KHÁCH HÀNG <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Tên khách hàng hoặc đại lý"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                SỐ ĐIỆN THOẠI
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="SĐT liên hệ"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                ĐỊA CHỈ
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Địa chỉ khách hàng"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                TRẠNG THÁI
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ExportOrder["status"])
                }
                className="w-full p-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none bg-blue-50 text-blue-700 border-blue-200"
              >
                <option value="exported">Đã xuất kho</option>
                <option value="sent">Đã gửi hàng</option>
                <option value="received">Khách đã nhận</option>
                <option value="pending_payment">Chờ thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="returned">Hoàn đơn</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                PHƯƠNG THỨC TT
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "cash" | "transfer")
                }
                className="w-full p-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="cash">Tiền mặt</option>
                <option value="transfer">Chuyển khoản</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">
                GHI CHÚ
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Ghi chú đơn hàng, địa chỉ giao hàng..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                TIỀN SHIP
              </label>
              <input
                type="number"
                value={otherCosts || ""}
                onChange={(e) => setOtherCosts(Number(e.target.value) || 0)}
                className="w-full p-2 border rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                TIỀN THUỐC KHÁC
              </label>
              <input
                type="number"
                value={otherMedsFee || ""}
                onChange={(e) => setOtherMedsFee(Number(e.target.value) || 0)}
                className="w-full p-2 border rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="bg-gray-100 p-2 text-xs font-bold flex justify-between items-center">
              <span>CHI TIẾT HÀNG XUẤT</span>
              <button
                onClick={addRow}
                className="bg-white border px-2 py-1 rounded text-teal-600 hover:bg-teal-50 text-xs font-bold"
              >
                <i className="fa-solid fa-plus mr-1"></i>Thêm dòng
              </button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="p-2 w-5/12">Sản phẩm</th>
                  <th className="p-2 w-2/12 text-center">Tồn kho</th>
                  <th className="p-2 w-2/12 text-center">SL Xuất</th>
                  <th className="p-2 w-2/12 text-right">Đơn giá</th>
                  <th className="p-2 w-2/12 text-right">Thành tiền</th>
                  <th className="p-2 w-1/12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => {
                  const p = products.find((x) => x.id === row.productId);
                  let currentStock = p ? getStock(p) : 0;
                  if (initialData && initialData.status !== "returned" && p) {
                    const oldItem = initialData.items.find(
                      (i) => i.productId === p.id,
                    );
                    if (oldItem) currentStock += oldItem.qty;
                  }

                  return (
                    <tr key={idx} className="border-b">
                      <td className="p-2">
                        <ProductAutocomplete
                          products={products}
                          value={row.productId}
                          onChange={(val) => updateRow(idx, "productId", val)}
                        />
                      </td>
                      <td className="p-2 text-center text-xs font-bold text-gray-500">
                        {p ? currentStock : "-"}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.qty}
                          min={1}
                          onChange={(e) =>
                            updateRow(idx, "qty", e.target.value)
                          }
                          className={`w-full p-1 border rounded text-xs text-center focus:ring-1 focus:ring-teal-500 focus:outline-none ${p && row.qty > currentStock ? "border-red-500 bg-red-50 text-red-600" : ""}`}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.price}
                          min={0}
                          onChange={(e) =>
                            updateRow(idx, "price", e.target.value)
                          }
                          className="w-full p-1 border rounded text-xs text-right font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-teal-700">
                        {formatPrice(row.qty * row.price)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeRow(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="bg-gray-50 p-3 flex flex-col gap-2 border-t">
              <div className="flex justify-end text-sm">
                <span className="font-bold mr-4 text-gray-600">
                  Tổng tiền hàng:
                </span>
                <span className="font-mono text-gray-800 font-bold">
                  {formatPrice(goodsTotal)}
                </span>
              </div>
              <div className="flex justify-end text-sm">
                <span className="font-bold mr-4 text-gray-600">Tiền ship:</span>
                <span className="font-mono text-gray-800 font-bold">
                  {formatPrice(otherCosts)}
                </span>
              </div>
              <div className="flex justify-end text-sm">
                <span className="font-bold mr-4 text-gray-600">
                  Tiền thuốc khác:
                </span>
                <span className="font-mono text-gray-800 font-bold">
                  {formatPrice(otherMedsFee)}
                </span>
              </div>
              <div className="flex justify-end text-lg mt-1 border-t pt-2">
                <span className="font-bold mr-4">Tổng cộng:</span>
                <span className="text-xl font-bold text-red-600 font-mono">
                  {formatPrice(totalCalc)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg border bg-white font-bold hover:bg-gray-100 text-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={saveOrder}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 text-sm disabled:opacity-50 flex items-center"
          >
            {isProcessing ? (
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fa-solid fa-check mr-2"></i>
            )}
            {initialData ? "Lưu thay đổi" : "Xác nhận xuất kho"}
          </button>
        </div>
      </div>
    </div>
  );
}
