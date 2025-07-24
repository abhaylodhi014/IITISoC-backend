import contactUs from "../models/ContactUs.model.js"



export const newContactUs = async (request, response) => {
    try {

        const mesg = await new contactUs(request.body);
        mesg.save();

       return response.status(200).json('message sent successfully');
    } catch (error) {
       return  response.status(500).json(error);
    }
}
