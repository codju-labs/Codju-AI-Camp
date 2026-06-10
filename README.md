# AI Creator Camp by Codju

Welcome to the **AI Creator Camp by Codju** repository. This is the official landing page for the AI Creator Camp, an immersive 7-day online program designed to teach young students (Grades 6–10) the fundamentals and creative applications of Artificial Intelligence.

## 🌟 Overview

Rather than teaching students to fear AI, this camp focuses on empowering them to lead with it through hands-on, project-based learning. Students learn to use modern AI tools to build real-world projects such as websites, apps, artwork, and videos.

- **Domain:** [codju.com](https://codju.com)
- **Target Audience:** Students in Grades 6–10 (ages 11–16)
- **Format:** Live Online (Zoom), 45-minute daily sessions
- **Dates:** June 22 – 28, 2025

## 🚀 Key Outcomes & Deliverables

- **8 Real Projects:** Students build practical projects during the camp.
- **15+ AI Tools Taught:** Hands-on experience with ChatGPT, Gemini, Perplexity, Canva AI, Leonardo AI, CapCut AI, HeyGen, Suno, Gamma, NotebookLM, Notion AI, Scratch, Miro AI, Wix AI, Lovable, Glide, and Replit AI.
- **Certificate of Completion:** Verified certificate awarded upon completion.
- **12 Months of Support:** Includes monthly update sessions, access to future live batches, and an AI mentor hotline.
- **Demo Day:** Concludes with a team hackathon and live presentation.

## 🛠 Tech Stack

This landing page is built with a focus on fast loading times, responsive design, and solid SEO:
- **HTML5:** Semantic structure and built-in SEO (Open Graph, JSON-LD schema, canonical URLs).
- **CSS3:** Vanilla CSS for maximum performance and flexible styling, utilizing modern CSS variables for a cohesive design system.
- **JavaScript (Vanilla):** For interactive components like smooth scrolling, mobile navigation, and active states.

## 📂 Project Structure

- `index.html` - The main landing page file. Includes structured data for SEO.
- `index.css` - Stylesheet for the landing page. Includes all design tokens, responsive queries, and animations.
- `index.js` - Scripts for interactive functionality.
- `robots.txt` - SEO guidelines for web crawlers.
- `sitemap.xml` - XML sitemap for search engine indexing.
- `/assets/` - Images, icons, and media files used on the site.
- `/logos/` - Brand logos.

## 💡 SEO Optimization

This website has been optimized for Search Engines:
- Detailed `<meta>` tags (description, keywords, author).
- **Open Graph & Twitter Cards:** For rich link previews on social media platforms.
- **JSON-LD Structured Data:** Course and FAQ schemas to help search engines understand the content and display rich snippets.
- Proper `<link rel="canonical">` to prevent duplicate content issues.
- `robots.txt` and `sitemap.xml` generated to guide web crawlers efficiently.

## 🏃‍♂️ How to Run Locally

1. Clone this repository or download the source code.
2. Install the Cloudflare development dependency with `npm install`.
3. Create a local `.dev.vars` file using the payment configuration below.
4. Start the site and Worker with `npm run dev`.
5. Open the local URL printed by Wrangler.

`npm run dev` and `npm run deploy` first copy only the public site files into
the generated `.site/` directory. This prevents Worker source, credentials,
and project metadata from being published as static assets.

## CCAvenue Payment Integration

The landing page posts enrollment details to a Cloudflare Worker. The Worker
sets the price, encrypts the CCAvenue request, redirects the parent to the
hosted CCAvenue checkout, decrypts the callback, and verifies merchant,
currency, and amount before displaying the result.

The browser never receives the CCAvenue Working Key and cannot choose the
payable amount.

### 1. Obtain the CCAvenue credentials

Activate the CCAvenue merchant account and obtain these values from the
CCAvenue merchant dashboard/integration kit:

- Merchant ID
- Access Code
- Working Key

Keep the Working Key secret. Do not add real credentials to Git or
`wrangler.jsonc`.

### 2. Configure the public Worker values

Edit `wrangler.jsonc`:

```jsonc
"vars": {
  "CCAVENUE_ENVIRONMENT": "production",
  "CAMP_PRICE_INR": "1999.00",
  "GST_RATE_PERCENT": "18",
  "PUBLIC_SITE_URL": "https://your-camp-domain.example"
}
```

`CAMP_PRICE_INR` is the fee before tax. The Worker calculates GST in paise,
adds it to the fee, and sends only the final total to CCAvenue. For a base fee
of INR 1,999, the total is INR 1,999 + INR 359.82 GST = INR 2,358.82.
Browser-supplied prices are ignored.

The CCAvenue endpoint and credentials must belong to the same environment:

- `production` sends payments to `https://secure.ccavenue.com` and must use
  live Merchant ID, Access Code, and Working Key values.
- `test` sends payments to `https://test.ccavenue.com` and requires separate
  test credentials supplied by CCAvenue.

Do not send live credentials to the test URL. If your account only has live
credentials, use `production` and test with a small real transaction, then
refund or cancel it from the CCAvenue merchant dashboard.

For local development, create `.dev.vars`:

```dotenv
CCAVENUE_MERCHANT_ID=your_merchant_id
CCAVENUE_ACCESS_CODE=your_access_code
CCAVENUE_WORKING_KEY=your_working_key
CAMP_PRICE_INR=1999.00
GST_RATE_PERCENT=18
PUBLIC_SITE_URL=http://localhost:8787
CCAVENUE_ENVIRONMENT=production
EMAILOCTOPUS_API_KEY=your_api_key
EMAILOCTOPUS_LIST_ID=your_list_id
EMAILOCTOPUS_AUTOMATION_ID=your_automation_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=worker@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_RANGE=Enrollments!A:Q
```

Use the actual local port printed by Wrangler if it is not `8787`.
CCAvenue must be able to reach the callback URL, so a localhost callback
cannot complete a full gateway round trip. Use the deployed HTTPS domain for
end-to-end testing.

### 3. Add Cloudflare secrets

Run:

```bash
npx wrangler secret put CCAVENUE_MERCHANT_ID
npx wrangler secret put CCAVENUE_ACCESS_CODE
npx wrangler secret put CCAVENUE_WORKING_KEY
npx wrangler secret put EMAILOCTOPUS_API_KEY
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
```

Enter each value when prompted. Secrets remain in Cloudflare and are not
included in the deployed JavaScript bundle.

### 4. Configure the CCAvenue return URL

Use this HTTPS URL in the CCAvenue merchant setup/allowlist:

```text
https://your-camp-domain.example/api/payments/callback
```

The Worker also sends this URL as both `redirect_url` and `cancel_url`.
The domain must match `PUBLIC_SITE_URL`.

### 5. Store and fulfill orders with D1

D1 is required. It stores the payment, enrollment ID, EmailOctopus status,
Google Sheets status, and fulfillment errors.

```bash
npx wrangler d1 create codju-camp-payments
```

Copy the returned database ID into the `d1_databases` block in
`wrangler.jsonc`, then apply the initial migration:

```bash
npx wrangler d1 migrations apply codju-camp-payments --remote
```

The migration is in `migrations/0001_payment_orders.sql`.

### 6. Configure EmailOctopus confirmation email

EmailOctopus does not expose direct transactional email sending. This
integration adds or updates the parent as a contact and starts an automation
that sends the confirmation email.

1. Create a dedicated EmailOctopus list for paid camp enrollments.
2. Create these text fields using these exact tags:
   `ParentName`, `StudentName`, `EnrollmentId`, `OrderId`, `AmountPaid`, and
   `TrackingId`.
3. Create an automation attached to that list.
4. Choose the **Started via API** trigger.
5. Add the enrollment confirmation email and use the fields above for
   personalization.
6. Enable repeat entry only if one parent may purchase multiple enrollments
   with the same email address.
7. Start the automation and copy its automation ID and list ID into
   `wrangler.jsonc`.

Use this as a dedicated operational list. Do not automatically send unrelated
marketing without the parent’s consent.

### 7. Configure Google Sheets

1. Create a Google Cloud project and enable the Google Sheets API.
2. Create a service account and download a JSON key.
3. Put `client_email` in `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
4. Store `private_key` as the `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` Worker
   secret.
5. Share the spreadsheet with the service account email as an Editor.
6. Put the spreadsheet ID in `GOOGLE_SHEETS_SPREADSHEET_ID`.
7. Create an `Enrollments` worksheet with this header row:

```text
Enrollment ID | Order ID | Tracking ID | Parent Name | Student Name |
Email | Phone | Base Amount | GST Amount | GST Rate | Total Amount |
Currency | Payment Mode | Bank Reference | Status | Order Created |
Fulfilled At
```

The Worker checks column A for the enrollment ID before appending, preventing
duplicate rows when CCAvenue retries its callback.

### 8. Fulfillment sequence

After a successful encrypted callback, the Worker:

1. Decrypts the callback and verifies merchant ID, currency, order amount, and
   successful status.
2. Stores the callback result and deterministic enrollment ID in D1.
3. Immediately displays the success page with the enrollment ID.
4. Uses `ctx.waitUntil()` to process EmailOctopus and Google Sheets in the
   background.
5. Upserts the EmailOctopus contact and starts the confirmation automation.
6. Adds the enrollment to Google Sheets at the same time.
7. Marks fulfillment complete in D1.

Creating or updating an EmailOctopus contact and then starting its automation
requires sequential API calls because the second call needs the contact ID.
Those calls do not delay the success page. EmailOctopus and Google Sheets run
concurrently in the background.

If an external API fails, the payment and enrollment remain stored and the
order is marked `Failed` with the specific step status. A Cron Trigger retries
pending or failed fulfillment every five minutes. Completed email or sheet
steps are not repeated, and stale `Processing` orders are recovered after ten
minutes.

Cloudflare limits request `waitUntil()` work to 30 seconds, so the scheduled
retry is important if an external service is slow or unavailable.

### Test fulfillment in isolation

The credential-free mock commands exercise the same EmailOctopus and Google
Sheets helper functions used after payment and print the outgoing requests:

```bash
npm run test:email
npm run test:sheet
```

They do not contact either provider or send an email. The existing automated
tests can also be run with `npm test`.

After receiving the credentials, add the following values to `.dev.vars`:

```dotenv
TEST_ENROLLMENT_EMAIL=your-own-email@example.com
EMAILOCTOPUS_API_KEY=your_api_key
EMAILOCTOPUS_LIST_ID=your_list_id
EMAILOCTOPUS_AUTOMATION_ID=your_automation_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=worker@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_RANGE=Enrollments!A:Q
```

Then run each live integration independently:

```bash
npm run test:email:live
npm run test:sheet:live
```

The email command creates or updates `TEST_ENROLLMENT_EMAIL` and starts the
real EmailOctopus automation. The sheet command appends a uniquely identified
test enrollment row. Neither command invokes CCAvenue or requires a payment.

If EmailOctopus returns `403 UNAUTHORISED` only when starting the automation,
the contact operation has already succeeded. Confirm that the automation is
active, its trigger is exactly **Started via API**, and its automation ID and
API key come from the same EmailOctopus account/workspace. Correct the setting
and rerun `npm run test:email:live`; the existing contact will be updated
rather than duplicated.

### 9. Test before going live

If CCAvenue supplied test credentials:

1. Set `CCAVENUE_ENVIRONMENT` to `test`.
2. Store the matching test credentials as Worker secrets.
3. Deploy to an HTTPS preview or staging domain.
4. Complete the enrollment form and test success, failure, and cancellation.

If you only have live credentials:

1. Keep `CCAVENUE_ENVIRONMENT` set to `production`.
2. Set a small temporary `CAMP_PRICE_INR`, such as `1.00`, if allowed by your
   CCAvenue account.
3. Deploy to the approved HTTPS domain.
4. Pay using a real payment method.
5. Confirm the callback status, order ID, amount, and tracking ID.
6. Cancel or refund the test transaction in the CCAvenue dashboard.
7. Restore the actual camp price before opening registrations.

### 10. Switch to production

1. Replace the test credentials with the production credentials using
   `wrangler secret put`.
2. Set `CCAVENUE_ENVIRONMENT` to `production`.
3. Confirm `PUBLIC_SITE_URL` is the final HTTPS domain.
4. Confirm the fee in `CAMP_PRICE_INR`.
5. Deploy with `npm run deploy`.
6. Complete one low-value live transaction and confirm it appears in
   CCAvenue, D1, EmailOctopus, and Google Sheets before opening registrations.

CCAvenue may require the live site to expose business contact details,
privacy policy, terms, cancellation/refund policy, and pricing before final
approval. Those policies should be reviewed by Codju before publishing.

## 📞 Contact

- **WhatsApp:** +91 82888 63132
- **Email:** info@codju.com
- **Website:** [codju.com](https://codju.com)
- **Lead Mentor:** Rohit K Bishnoi (IIT Kanpur, IIM Kozhikode)
