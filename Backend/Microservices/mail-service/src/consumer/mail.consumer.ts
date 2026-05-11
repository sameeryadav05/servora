import transporter from "../config/mail.js";
import { getChannel, Queue } from "../config/rabbitmq.js";



export async function startMailConsumer()
{
    const channel = getChannel();

    // channel.prefetch(1)

    channel.consume(Queue,async (msg)=>{
        if(!msg) return;

        
        try {
            const data = JSON.parse(msg.content.toString())

            if(data.type == 'SIGNUP_OTP')
            {
                const {email,fullName,otp} = data.payload;
                await transporter.sendMail({
                    from:`"Urban Service" <sameer.manoj2005@gmail.com>`,
                    to:email,
                    subject:'Your OTP Code',
                    html:`
                        <h2>Hello ${fullName}</h2>
                        <p>Your OTP is:</p>
                        <h1>${otp}</h1>
                        <p>This OTP is valid for 5 minutes.</p>
                    `,})

                console.log(`Mail Sent to ${email}`)

                channel.ack(msg)
            }
            else if(data.type == 'RESET_PASSWORD')
            {
                const {email,resetLink} = data.payload;
                await transporter.sendMail({
                    from:`"Urban Service" <sameer.manoj2005@gmail.com>`,
                    to:email,
                    subject:"Reset Your Password",
                    html: `
                    <h2>Password Reset</h2>
                    <p>Click below to reset your password:</p>
                    <a href="${resetLink}"      
                    style="
                            display: inline-block;
                            padding: 10px 20px;
                            background-color: #007bff;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 5px;
                            font-size: 16px;
                        ">Reset Password</a>
                    <p>This link expires in 10 minutes.</p>
                    `
                    ,})

                console.log(`Reset Password Mail Sent to ${email}`)

                channel.ack(msg)
            }
            
        } catch (error) {
            console.log("Failed To Send Mail !",error)

            channel.nack(msg,false,false);
            
        }
    })
    
}