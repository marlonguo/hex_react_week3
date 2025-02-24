import { useState, useEffect, useRef } from "react";

import axios from "axios";
import { Modal } from "bootstrap";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const defaultModalState = {
    title: "",
    category: "",
    origin_price: "",
    price: "",
    unit: "",
    description: "",
    content: "",
    is_enabled: false,
    imageUrl: "",
    imagesUrl: [""],
  };

  const [account, setAccount] = useState({
    username: "",
    password: "",
  });

  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const [productModalMode, setProductModalMode] = useState(null);

  const token = document.cookie.replace(
    /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
  );

  const Mode = {
    create: "新增",
    edit: "編輯",
  };

  function handleAccountInputChange(e) {
    const { name, value } = e.target;
    setAccount((account) => {
      return { ...account, [name]: value };
    });
  }

  function handleProductInputChange(e) {
    const { name, value } = e.target;
    setTempProduct((tempProduct) => {
      return { ...tempProduct, [name]: value };
    });
  }

  async function getProducts() {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products`
      );

      return res.data;
    } catch (error) {
      alert("取得產品資料失敗");
    }
  }

  async function createProduct() {
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0,
        },
      });
    } catch (error) {
      alert("新增產品失敗");
    }
  }

  async function updateProduct() {
    try {
      await axios.put(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`,
        {
          data: {
            ...tempProduct,
            origin_price: Number(tempProduct.origin_price),
            price: Number(tempProduct.price),
            is_enabled: tempProduct.is_enabled ? 1 : 0,
          },
        }
      );
    } catch (error) {
      alert("更新產品失敗");
    }
  }

  async function deleteProduct() {
    try {
      await axios.delete(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`
      );
    } catch (error) {
      alert("刪除產品失敗");
    }
  }

  async function handleUpdateProduct() {
    const apiCall =
      productModalMode === "create" ? createProduct : updateProduct;
    try {
      await apiCall();
      const { products } = await getProducts();
      setProducts(products);
    } catch (error) {
      alert("更新產品失敗");
    }
  }

  async function handleDeleteProduct() {
    await deleteProduct();
    const { products } = await getProducts();
    setProducts(products);
  }

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);
      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;

      axios.defaults.headers.common["Authorization"] = token;
      const { products } = await getProducts();

      setProducts(products);

      setIsAuth(true);
    } catch (error) {
      alert("登入失敗");
    }
  }

  async function checkUserLogin() {
    axios.defaults.headers.common["Authorization"] = token;
    try {
      const res = await axios.post(`${BASE_URL}/v2/api/user/check`);
      return res.data;
    } catch (error) {}
  }

  function handleOpenProductModal(mode, product) {
    setProductModalMode(mode);
    if (product.imagesUrl === undefined) {
      product.imagesUrl = [""];
    }
    setTempProduct(product);
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  }

  function handleOpenDeleteProductModal(product) {
    setTempProduct(product);
    const modalInstance = Modal.getInstance(deleteProductModalRef.current);
    modalInstance.show();
  }

  function handleProductInputChange(e) {
    const { value, name, type, checked } = e.target;
    setTempProduct((tempProduct) => {
      return {
        ...tempProduct,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  }

  function handleImageChange(e, index) {
    const { value } = e.target;
    const imagesUrl = [...tempProduct.imagesUrl];

    imagesUrl[index] = value;
    setTempProduct((tempProduct) => {
      return {
        ...tempProduct,
        imagesUrl,
      };
    });
  }

  function handleAddImages() {
    const imagesUrl = [...tempProduct.imagesUrl, ""];

    setTempProduct((tempProduct) => {
      return {
        ...tempProduct,
        imagesUrl,
      };
    });
  }

  function handleRemoveImages(index) {
    const imagesUrl = [...tempProduct.imagesUrl];
    imagesUrl.splice(index, 1);

    setTempProduct((tempProduct) => {
      return {
        ...tempProduct,
        imagesUrl,
      };
    });
  }

  const productModalRef = useRef(null);
  const deleteProductModalRef = useRef(null);

  // 如果已經登入過並記錄過 token, 將 isAuth 設為 true, 渲染產品列表
  useEffect(() => {
    (async function () {
      if (token) {
        const res = await checkUserLogin();
        if (res.success) {
          const { products } = await getProducts();
          setProducts(products);

          setIsAuth(true);
        }
      }
    })();
  }, []);

  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: false,
    });

    new Modal(deleteProductModalRef.current, {
      backdrop: false,
    });
  }, []);

  return (
    <>
      {isAuth ? (
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="d-flex">
                <h2 className="me-auto">產品列表</h2>
                <button
                  onClick={() =>
                    handleOpenProductModal("create", defaultModalState)
                  }
                  type="button"
                  className="btn btn-primary mb-3"
                >
                  建立新的產品
                </button>
              </div>
              <table className="table mt-3">
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.title}</td>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>
                        {product.is_enabled > 0 ? (
                          <span className="text-success">啟用</span>
                        ) : (
                          <span>未啟用</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-primary me-1"
                          onClick={() =>
                            handleOpenProductModal("edit", product)
                          }
                        >
                          編輯
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleOpenDeleteProductModal(product)}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <h3>請先登入</h3>
          <form onSubmit={handleLogin} className="d-flex flex-column">
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="帳號"
                name="username"
                value={account.username}
                onChange={handleAccountInputChange}
              />
              <label htmlFor="email">帳號</label>
            </div>
            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="password"
                name="password"
                value={account.password}
                onChange={handleAccountInputChange}
              />
              <label htmlFor="password">密碼</label>
            </div>
            <button className="btn btn-primary">登入</button>
          </form>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      {/* {product modal} */}
      <div
        ref={productModalRef}
        className="modal"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{Mode[productModalMode]}產品</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-6">
                  <label htmlFor="title" className="form-label">
                    標題
                  </label>
                  <input
                    onChange={handleProductInputChange}
                    value={tempProduct.title}
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                  />
                  <label htmlFor="category" className="form-label">
                    分類
                  </label>
                  <input
                    onChange={handleProductInputChange}
                    value={tempProduct.category}
                    type="text"
                    className="form-control"
                    id="category"
                    name="category"
                  />
                  <label htmlFor="unit" className="form-label">
                    單位
                  </label>
                  <input
                    onChange={handleProductInputChange}
                    value={tempProduct.unit}
                    type="text"
                    className="form-control"
                    id="unit"
                    name="unit"
                  />
                  <div className="container">
                    <div className="row">
                      <div className="col-6">
                        <label htmlFor="origin_price" className="form-label">
                          原價
                        </label>
                        <input
                          onChange={handleProductInputChange}
                          value={tempProduct.origin_price}
                          type="number"
                          className="form-control"
                          id="origin_price"
                          name="origin_price"
                        />
                      </div>

                      <div className="col-6">
                        <label htmlFor="price" className="form-label">
                          售價
                        </label>
                        <input
                          onChange={handleProductInputChange}
                          value={tempProduct.price}
                          type="number"
                          className="form-control"
                          id="price"
                          name="price"
                        />
                      </div>
                    </div>
                  </div>
                  <label htmlFor="description" className="form-label">
                    商品描述
                  </label>
                  <textarea
                    onChange={handleProductInputChange}
                    value={tempProduct.description}
                    row="5"
                    cols="33"
                    className="form-control"
                    id="description"
                    name="description"
                  />
                  <label htmlFor="content" className="form-label">
                    內容說明
                  </label>
                  <input
                    onChange={handleProductInputChange}
                    value={tempProduct.content}
                    type="text"
                    className="form-control"
                    id="content"
                    name="content"
                  />
                  <div className="form-check">
                    <input
                      onChange={handleProductInputChange}
                      checked={tempProduct.is_enabled}
                      type="checkbox"
                      className="form-check-input"
                      id="is_enabled"
                      name="is_enabled"
                    />
                    <label htmlFor="is_enabled" className="form-check-label">
                      是否啟用
                    </label>
                  </div>
                </div>
                <div className="col-6">
                  <label htmlFor="imageUrl" className="form-label">
                    商品圖
                  </label>
                  <input
                    onChange={handleProductInputChange}
                    value={tempProduct.imageUrl}
                    type="text"
                    className="form-control"
                    id="imageUrl"
                    name="imageUrl"
                  />
                  {tempProduct.imageUrl !== "" && (
                    <img
                      src={tempProduct.imageUrl}
                      alt={tempProduct.title}
                      className="img-fluid"
                    />
                  )}

                  {[].map((item, index) => (
                    <h3>xxx</h3>
                  ))}

                  {tempProduct.imagesUrl.map((image, index) => (
                    <div key={index} className="mb-2">
                      <label
                        htmlFor={`imagesUrl-${index + 1}`}
                        className="form-label"
                      >
                        更多圖片 {index + 1}
                      </label>
                      <input
                        value={image}
                        onChange={(e) => handleImageChange(e, index)}
                        id={`imagesUrl-${index + 1}`}
                        type="text"
                        className="form-control mb-2"
                      />
                      {image && (
                        <>
                          <img
                            src={image}
                            alt={`更多圖片 ${index + 1}`}
                            className="img-fluid mb-2"
                          />

                          <button
                            onClick={(e) => handleRemoveImages(index)}
                            className="btn btn-outline-danger btn-sm w-100"
                          >
                            取消圖片
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="btn-group w-100">
                    {tempProduct.imagesUrl.length > 0 &&
                      tempProduct.imagesUrl.length < 5 &&
                      tempProduct.imagesUrl[
                        tempProduct.imagesUrl.length - 1
                      ] !== "" && (
                        <button
                          className="btn btn-outline-primary btn-sm w-100"
                          type="button"
                          onClick={handleAddImages}
                        >
                          新增圖片
                        </button>
                      )}

                    {/* {tempProduct.imagesUrl.length > 1 && (
                      <button
                        onClick={handleRemoveImages}
                        className="btn btn-outline-danger btn-sm w-100"
                      >
                        取消圖片
                      </button>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                取消
              </button>
              <button
                onClick={handleUpdateProduct}
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* {delete product modal} */}
      <div ref={deleteProductModalRef} className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">刪除產品</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                是否要刪除
                <span className="text-danger">{tempProduct.title}</span>
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                否
              </button>
              <button
                onClick={handleDeleteProduct}
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
              >
                是
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
