import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addAddress = asyncHandler(async(req,res)=> {
    const {name , phone, street, city, state, pincode, isDefault} = req.body;
    const address = await Address.create({user: req.user._id, name, phone, street,city,state,pincode,isDefault});
    return res.status(201).json(new ApiResponse(201, address, "Address added successfully"));
});

const getAddresses = asyncHandler(async(req,res) => {
    const addresses = await Address.find({user: req.user._id});
    return res.status(200).json(new ApiResponse(200, addresses, 'Addresses retrieved successfully'));
})

const updateAddresses = asyncHandler(async (req,res) => {
    const {addressId} = req.params;
    const address = await Address.findOneAndUpdate({ _id: addressId, user: req.user._id}, req.body, {new: true})
    if(!address) throw new ApiError(404, "Address not found");
    return res.status(200).json(new ApiResponse(200, address, 'Address updated successfully'))
})

const deleteAddress = asyncHandler(async (req,res) => {
    const {addressId} = req.params;
    const address = await Address.findOneAndDelete({ _id: addressId, user: req.user._id});
    if(!address) throw new ApiError(404, "Address not found");
    return res.status(200).json(new ApiResponse(200, {}, "Address not found"));
});

const getCurrentUser = asyncHandler(async (req,res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User profile fetched successfully"));
});

export {
    addAddress,
    getAddresses,
    updateAddresses,
    deleteAddress,
    getCurrentUser
};