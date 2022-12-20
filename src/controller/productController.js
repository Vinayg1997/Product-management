const productModel = require('../model/productModel')
const uploadFile = require('../aws/aws')
const validator = require('../validator/validator')



//===================== [function for Create Product Data] =====================//
const createProduct = async (req, res) => {

    try {

        let data = req.body
        let files = req.files

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage, ...rest } = data

        //------------------- Checking Mandotory Field ----------------------//
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "Body cannot be empty. Please Provide the Mandatory Fields (i.e. title, description, price, currencyId, currencyFormat, productImage ). " });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "INVALID INPUT... input only title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments." }) }


        let obj = {}

        //--------------- validations ---------------------//
        if (!validator.isValidInput(title)) { return res.status(400).send({ status: false, message: "Please enter title" }) }
        if (!validator.isValidProdName(title)) { return res.status(400).send({ status: false, message: "please provide a valid Title of product" }) }
        obj.title = title

        if (!validator.isValidInput(description)) return res.status(400).send({ status: false, message: "Please enter description" });
        obj.description = description

        if (!validator.isValidInput(price)) return res.status(400).send({ status: false, message: "Please enter price" });
        if (!validator.isValidPrice(price)) return res.status(400).send({ status: false, message: "INVALID INPUT... Please enter valid price" });
        obj.price = price

        if (currencyId || currencyId == '') {
            if (!validator.isValidInput(currencyId)) return res.status(400).send({ status: false, message: "Please enter CurrencyId" });
            if (currencyId != 'INR') return res.status(400).send({ status: false, message: "CurrencyId must be 'INR'" });
            obj.currencyId = currencyId
        }

        if (currencyFormat || currencyFormat == '') {
            if (!validator.isValidInput(currencyFormat)) return res.status(400).send({ status: false, message: "Please enter currencyFormat" });
            if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "Currency Format must be ₹" });
            obj.currencyFormat = currencyFormat
        }

        if (isFreeShipping) {
            if (!validator.isValidInput(isFreeShipping)) return res.status(400).send({ status: false, message: "Please enter value of Free Shipping" });
            if (isFreeShipping !== 'true' && isFreeShipping !== 'false') return res.status(400).send({ status: false, message: "INVALID INPUT... This field accepts only true or false" });
            obj.isFreeShipping = isFreeShipping
        }

        if (style) {
            if (!validator.isValidInput(style)) return res.status(400).send({ status: false, message: "Please enter style" });
            if (!validator.isValidName(style)) return res.status(400).send({ status: false, message: "INVALID INPUT... Please enter valid style!" });
            obj.style = style
        }

        if (!validator.isValidInput(availableSizes)) return res.status(400).send({ status: false, message: "Please enter Size" });
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes)) return res.status(400).send({ status: false, message: 'INVALID INPUT... Selecte one of these given size option: (S , XS, M, X, L, XXL, XL) ' });
        
        obj.availableSizes = availableSizes

        if (installments || installments == '') {
            if (!validator.isValidInput(installments)) return res.status(400).send({ status: false, message: "Please enter installments" });
            if (!validator.isValidInstallment(installments)) return res.status(400).send({ status: false, message: "INVALID INPUT... Please enter valid Installments number" });
            obj.installments = installments
        }


        //-------------- checking if product title is already present or not -----------//
        const checkTitle = await productModel.findOne({ title: title });
        if (checkTitle) {
            return res.status(400).send({ status: false, message: "Title Already Exist, Please Enter Another Title!" });
        }


        //---------------- Validating ProductImage ---------------//
        if (files && files.length > 0) {
            if (files.length > 1) return res.status(400).send({ status: false, message: "More than one File cannot be accepted" })
            if (!validator.isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "please provide image file only" }) }
            let uploadedFileURL = await uploadFile(files[0])
            obj.productImage = uploadedFileURL
        } else {
            return res.status(400).send({ message: "Product Image is Mandatory. Please provide image of the Product" })
        }


        let createProduct = await productModel.create(obj)

        return res.status(201).send({ status: true, message: "Success", data: createProduct })

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}


//===================== [function for Get Data of Products] =====================//

const getProduct = async (req, res) => {

    try {

        let data = req.query

        let { size, name, priceGreaterThan, priceLessThan, priceSort, ...rest } = data

        //----------------- Checking Mandotory Field -----------------//
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "You can input only size, name, priceGreaterThan, priceLessThan, priceSort" }) }

        if (!validator.checkInput(data)) {
            let productData = await productModel.find({ isDeleted: false })
            if (productData.length == 0) return res.status(404).send({ status: false, message: "Products not found" })
            return res.status(200).send({ status: true, message: "Success", data: productData });
        }

        //------------------ Validations --------------------//
        if (size || size == '') {
            if (!validator.isValidInput(size)) return res.status(400).send({ status: false, message: "Please enter Size" });    
            if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size)) return res.status(400).send({ status: false, message: "INVALID INPUT... Select one of these given size option: (S , XS, M, X, L, XXL, XL)" });    
        }

        if (name || name == '') {
            if (!validator.isValidInput(name)) { return res.status(400).send({ status: false, message: "Please enter name" }) }
            if (!validator.isValidProdName(name)) { return res.status(400).send({ status: false, message: "INVALID INPUT... Please provid valid name" }) }
        }

        if (priceGreaterThan || priceGreaterThan == '') {
            if (!validator.isValidInput(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter Price Greater Than" });
            if (!validator.isValidPrice(priceGreaterThan)) return res.status(400).send({ status: false, message: "priceGreaterThan must be number" });
        }

        if (priceLessThan || priceLessThan == '') {
            if (!validator.isValidInput(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter Price Lesser Than" });
            if (!validator.isValidPrice(priceLessThan)) return res.status(400).send({ status: false, message: "priceLessThan must be number" });
        }

        if (priceSort || priceSort == '') {
            if (!(priceSort == -1 || priceSort == 1)) return res.status(400).send({ status: false, message: "Use '1' key to get data from high price or '-1' key to get data from low price" });
        }

        //--------------- Fetching All Data from Product DB ----------------//
        let getProduct = await productModel.find({isDeleted: false, title: {$regex: data.name}, price: {$gt: data.priceGreaterThan, $lt: data.priceLessThan}, availableSizes: { $all: data.size} }).sort({ price: priceSort })

        //--------------- Checking Data is Present or Not in DB --------------//
        if (getProduct.length == 0) return res.status(404).send({ status: false, message: "Product Not Found." })

        return res.status(200).send({ status: true, message: "Success", data: getProduct })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}


//===================== [function for Get Data of Products By Path Param =====================//
const getProductById = async (req, res) => {

    try {

        let productId = req.params.productId

        if (!validator.isValidObjectId(productId)) return res.status(400).send({ status: false, message: `Given productID: ${productId} is Invalid` })
        let getProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!getProduct) return res.status(404).send({ status: false, message: "Product Data is Not Found" })

        return res.status(200).send({ status: true, message: "Success", data: getProduct })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = {createProduct, getProduct, getProductById}