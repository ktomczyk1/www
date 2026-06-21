const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSSequelize = require("@adminjs/sequelize");
const uploadFeature = require("@adminjs/upload"); 

// Dodajemy dwie wbudowane biblioteki Node.js (nie trzeba robić npm install)
const path = require("path"); 
const crypto = require("crypto"); 

// 1. Inicjujemy ComponentLoader
const { ComponentLoader } = require("adminjs");
const componentLoader = new ComponentLoader();

const Category = require("./models/Category");
const Product = require("./models/Product");
const Order = require("./models/Order");
const OrderItem = require("./models/OrderItem");

AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

const adminJs = new AdminJS({
  rootPath: "/admin",
  componentLoader, // 2. Przekazujemy ComponentLoader do głównego panelu
  resources: [
    Category,
    {
      resource: Product,
      options: {
        // 1. Usunięto 'image' z widoku edycji, zostawiono samo 'uploadFile'
        editProperties: ['name', 'CategoryId', 'stock', 'price', 'description', 'uploadFile'],        
        properties: {
          // 2. Konfigurujemy widoczność 'image' - znika z formularza (edit: false),
          // ale wciąż będzie widoczne w tabeli produktów (list: true)
          image: {
            isVisible: { edit: false, show: true, list: true, filter: false }
          }
        }
      },
      features: [
        uploadFeature({
          componentLoader,
          provider: { 
            local: { 
              bucket: "public/uploads",
              opts: { baseUrl: "/uploads" }
            } 
          },
          properties: {
            key: "image",         // Pole w bazie
            file: "uploadFile"    // Nasz przycisk z plikiem
          },
          validation: { 
            mimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"] 
          },
          // 3. Nadpisujemy domyślne nazewnictwo plików
          uploadPath: (record, filename) => {
            const ext = path.extname(filename); 
            const randomName = crypto.randomBytes(8).toString('hex'); 
            
            // Wyrzuciliśmy `${record.id()}/`
            // Teraz plik wyląduje bezpośrednio w public/uploads/ np. jako '8f3a1b2c.png'
            return `${randomName}${ext}`; 
          }
        })
      ]
    },
    {
      resource: Order,
      options: {
        titleProperty: "id",
        properties: {
          id: {
            isTitle: true,
            isVisible: { list: true, filter: true, show: true, edit: false }
          }
        }
      }
    },
    {
      resource: OrderItem,
      options: {
        listProperties: ["id", "orderId", "productId", "quantity", "price", "createdAt"],
        editProperties: ["orderId", "productId", "quantity", "price"],
        showProperties: ["id", "orderId", "productId", "quantity", "price", "createdAt", "updatedAt"],
        properties: {
          orderId: {
            reference: "Orders",
            isRequired: true
          },
          productId: {
            reference: "Products",
            isRequired: true
          }
        }
      }
    }
  ]
});

const router = AdminJSExpress.buildRouter(adminJs);

module.exports = { adminJs, router };