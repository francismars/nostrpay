# PubPay: Public Payments on Nostr

PubPay is a decentralized payment system built on the Nostr protocol that allows users to create public payment requests using `kind: 1` events. By leveraging Nostr's tagging system, PubPay enables flexible and customizable payment requests that can be tailored to specific use cases. These payment requests are published to Nostr relays, making them publicly accessible and verifiable. It integrates with the Lightning Network for seamless payments. PubPay enables a wide range of payment scenarios, from simple fixed payments to complex, conditional payments. Whether you're splitting bills, requesting a donation, selling a service, or managing payments for a project, PubPay provides the tools to make it happen.

---

## **Features**

- **Public Payments**: Create and publish payment requests as `kind: 1` events on Nostr relays.
- **Lightning Network Integration**: Use lightning wallet or browser extensions for the payments.
- **Customizable Payment Requests**: Define payment parameters using tags like `zap-min`, `zap-max`, `zap-uses`, and more.
- **Multiple Sign-In Methods**:
  - **Extension**: Use browser extensions like Alby.
  - **External Signer**: Sign events with External Signers like Amber.
  - **Private Key (`nsec`)**: Sign events directly using your private key.
- **Public and Transparent**: Payment requests and events are publicly accessible on Nostr relays.

---

## **How PubPay Works**

1. **Nostr Protocol**:  
   PubPay uses the Nostr protocol, a decentralized, censorship-resistant communication protocol. Events on Nostr are structured data objects that can include metadata, content, and tags. PubPay utilizes `kind: 1` events (text notes) to represent payment requests.

2. **Tags for Payment Metadata**:  
   Tags in Nostr events are key-value pairs that add metadata to the event. PubPay uses specific tags to define payment parameters, such as the amount, payer, and payment conditions. These tags make the payment request machine-readable and interoperable with other Nostr-based applications.

3. **Public Accessibility**:  
   Payment requests are published to Nostr relays, making them publicly accessible. Anyone with access to the relays can view and interact with the payment request.

---

## **Implemented Tags**

PubPay uses the following tags to define payment requests:

### **1. `zap-min`**

- **Description**: Specifies the minimum amount (in millisatoshis) that can be paid for the request.
- **Example**:
  ```json
  ["zap-min", "1000"]
  ```
  This tag indicates that the minimum payment amount is 1,000 millisatoshis (1 satoshi).

### **2. `zap-max`**

- **Description**: Specifies the maximum amount (in millisatoshis) that can be paid for the request.
- **Example**:
  ```json
  ["zap-max", "5000"]
  ```
  This tag indicates that the maximum payment amount is 5,000 millisatoshis (5 satoshis).

### **3. `zap-uses`**

- **Description**: Specifies the number of times the payment request can be used.
- **Example**:
  ```json
  ["zap-uses", "10"]
  ```
  This tag indicates that the payment request can be used up to 10 times.

### **4. `zap-lnurl`**

- **Description**: Overrides the default Lightning Network address (lud16) for the payment request.
- **Example**:
  ```json
  ["zap-lnurl", "user@lnprovider.net"]
  ```
  This tag specifies a custom Lightning Network address for the payment.

### **5. `zap-payer`**

- **Description**: Specifies the public key (`npub`) of the payer who is allowed to make the payment.
- **Example**:
  ```json
  ["zap-payer", "npub1examplepublickey..."]
  ```
  This tag restricts the payment to a specific payer.

---

## **Examples of Use Cases**

### **1. Fixed Payment Request**

A user wants to request a fixed payment of 10,000 millisatoshis (10 satoshis). The `kind: 1` event would include the following tags:

```json
{
  "kind": 1,
  "tags": [
    ["t", "pubpay"],
    ["zap-min", "10000"],
    ["zap-max", "10000"]
  ],
  "content": "Please pay 10 satoshis for this service."
}
```

### **2. Range Payment Request**

A user wants to request a payment within a range of 5,000 to 20,000 millisatoshis (5 to 20 satoshis). The `kind: 1` event would include:

```json
{
  "kind": 1,
  "tags": [
    ["t", "pubpay"],
    ["zap-min", "5000"],
    ["zap-max", "20000"]
  ],
  "content": "Pay any amount between 5 and 20 satoshis."
}
```

### **3. Payment with Specific Payer**

A user wants to request a payment of 15,000 millisatoshis (15 satoshis) from a specific payer:

```json
{
  "kind": 1,
  "tags": [
    ["t", "pubpay"],
    ["zap-min", "15000"],
    ["zap-max", "15000"],
    ["zap-payer", "npub1examplepublickey..."]
  ],
  "content": "Pay 15 satoshis. Only the specified payer can make this payment."
}
```

### **4. Payment with Custom LNURL**

A user wants to override the default Lightning Network address for the payment:

```json
{
  "kind": 1,
  "tags": [
    ["t", "pubpay"],
    ["zap-min", "10000"],
    ["zap-max", "10000"],
    ["zap-lnurl", "user@lnprovider.net"]
  ],
  "content": "Pay 10 satoshis to the specified LN address."
}
```

---

## **Installation**

### **1. Clone the Repository**

```bash
git clone https://github.com/francismars/pubpay.git
cd pubpay
```

### **2. Install Dependencies**

Ensure you have [Node.js](https://nodejs.org/) installed. Then, run:

```bash
npm install
```

### **3. Start the Development Server**

```bash
npm start
```

### **4. Open the Application**

Visit the application in your browser:

```
http://localhost:3001
```

---

## **How to Use PubPay**

### **1. Sign In**

- Click the "Login" button.
- Choose one of the following sign-in methods:
  - **Extension**: Use a browser extension like Alby.
  - **External Signer**: Use an external signer like Amber.
  - **Private Key (`nsec`)**: Sign events directly using your private key.

### **2. Create a Payment Request**

- Click "New Paynote" to open the payment request form.
- Choose between:
  - **Fixed Payment**: Specify a single payment amount.
  - **Range Payment**: Specify a minimum and maximum payment range.
- Add optional parameters:
  - **`zap-uses`**: Limit the number of times the payment request can be used.
  - **`zap-lnurl`**: Override the default Lightning Network address.
  - **`zap-payer`**: Restrict the payment to a specific payer.
- Submit the form to publish the payment request as a `kind: 1` event.

### **3. Share the Payment Request**

- Share the event ID or link to the payment request.
- Users can view the payment request on Nostr-compatible clients.

### **4. Make a Payment**

- Users can pay using a Lightning-enabled wallet by scanning a QR code or clicking a `lightning:` link.

### **5. Verify Payments**

- Payments can be verified by checking the associated `kind: 9735` events on Nostr relays.

---

### **Clipboard Integration**

PubPay uses the Clipboard API to handle signing and payment workflows. Ensure the document is focused when accessing the clipboard to avoid errors.

---

## **Known Issues**

- **Custom Protocols**: The `lightning:` protocol may not work on all mobile browsers.
- **Clipboard Access**: Clipboard API requires user permissions and may not work in incognito mode or unsupported browsers.
- **Relay Connectivity**: Ensure the relays are online and accessible for publishing and subscribing to events.

---

## **License**

This project is licensed under the MIT License.

---
