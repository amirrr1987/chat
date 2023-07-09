import { z } from 'zod'


const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const passwordRegex = new  RegExp(
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d]{8,}$/
);


export const loginSchema = z.object({
  mobile: z.string(),
  password: z.string()
}).strict();
export type Login = z.infer<typeof loginSchema>;


export const registerSchema = z.object({

  mobile: z.string().regex(phoneRegex, 'Invalid Number!'),
  password: z.string(),
  confirmPassword: z.string()
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
})
export type Register = z.infer<typeof registerSchema>;
