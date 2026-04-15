import { createThirdwebClient } from "thirdweb";

// Replace this placeholder with your actual thirdweb client ID
// Get one from: https://thirdweb.com/create-api-key
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "b4df44a991823abfd66943e1ee54605";

export const client = createThirdwebClient({
  clientId: clientId,
});
