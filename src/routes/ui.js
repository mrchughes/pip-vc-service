const express = require('express');
const path = require('path');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Set view engine and views directory
router.use((req, res, next) => {
    res.locals.serviceName = process.env.SERVICE_NAME || 'PIP VC Service';
    res.locals.serviceDomain = process.env.SERVICE_DOMAIN || 'pip.gov.uk';
    res.locals.user = req.user || null;
    next();
});

/**
 * Home page
 * GET /
 */
router.get('/', optionalAuth, (req, res) => {
    const loginSuccess = req.query.login === 'success';

    res.send(generateHomePage({
        user: req.user,
        loginSuccess: loginSuccess
    }));
});

/**
 * Login page
 * GET /login
 */
router.get('/login', (req, res) => {
    res.send(generateLoginPage());
});

/**
 * Dashboard (authenticated users)
 * GET /dashboard
 */
router.get('/dashboard', optionalAuth, (req, res) => {
    if (!req.user) {
        return res.redirect('/login?redirect=/dashboard');
    }

    res.send(generateDashboardPage(req.user));
});

/**
 * VC Preview page
 * GET /vc-preview
 */
router.get('/vc-preview', optionalAuth, (req, res) => {
    if (!req.user) {
        return res.redirect('/login?redirect=/vc-preview');
    }

    res.send(generateVcPreviewPage(req.user));
});

/**
 * VC Management page
 * GET /credentials
 */
router.get('/credentials', optionalAuth, (req, res) => {
    if (!req.user) {
        return res.redirect('/login?redirect=/credentials');
    }

    res.send(generateCredentialsPage(req.user));
});

/**
 * Generate the home page HTML
 */
function generateHomePage(data) {
    return `
<!DOCTYPE html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <title>PIP VC Service - GOV.UK</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0b0c0c">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="stylesheet" href="https://design-system.service.gov.uk/stylesheets/govuk-frontend-4.7.0.min.css">
  <style>
    .hero-section {
      background: #1d70b8;
      color: white;
      padding: 60px 0;
    }
    .hero-section h1 {
      color: white;
      margin-bottom: 20px;
    }
    .feature-list {
      list-style: none;
      padding: 0;
    }
    .feature-list li {
      margin-bottom: 10px;
      padding-left: 25px;
      position: relative;
    }
    .feature-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #00703c;
      font-weight: bold;
    }
  </style>
</head>
<body class="govuk-template__body">
  <header class="govuk-header" role="banner">
    <div class="govuk-header__container govuk-width-container">
      <div class="govuk-header__logo">
        <a href="/" class="govuk-header__link govuk-header__link--homepage">
          <span class="govuk-header__logotype">
            <span class="govuk-header__logotype-text">GOV.UK</span>
          </span>
        </a>
      </div>
      <div class="govuk-header__content">
        <a href="/" class="govuk-header__link govuk-header__service-name">
          PIP VC Service
        </a>
      </div>
    </div>
  </header>

  <div class="govuk-width-container">
    ${data.loginSuccess ? `
    <div class="govuk-notification-banner govuk-notification-banner--success" role="alert">
      <div class="govuk-notification-banner__header">
        <h2 class="govuk-notification-banner__title">Success</h2>
      </div>
      <div class="govuk-notification-banner__content">
        <p class="govuk-notification-banner__heading">You have successfully logged in</p>
      </div>
    </div>
    ` : ''}

    <main class="govuk-main-wrapper" id="main-content" role="main">
      <div class="hero-section">
        <div class="govuk-width-container">
          <h1 class="govuk-heading-xl">Personal Independence Payment Digital Credentials</h1>
          <p class="govuk-body-l">Get your PIP benefit award as a secure digital credential that you control</p>
          ${data.user ? `
            <a href="/dashboard" class="govuk-button govuk-button--start govuk-button--white">
              Go to dashboard
              <svg class="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="m0 0h13l20 20-20 20H0l20-20z"/>
              </svg>
            </a>
          ` : `
            <a href="/login" class="govuk-button govuk-button--start govuk-button--white">
              Start now
              <svg class="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="m0 0h13l20 20-20 20H0l20-20z"/>
              </svg>
            </a>
          `}
        </div>
      </div>

      <div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds">
          <h2 class="govuk-heading-l">What you can do</h2>
          <ul class="feature-list">
            <li>Get a digital version of your PIP benefit award</li>
            <li>Store credentials securely in your personal data store</li>
            <li>Control who can access your benefit information</li>
            <li>Use credentials with other government services</li>
            <li>Revoke access at any time</li>
          </ul>

          <h2 class="govuk-heading-l">How it works</h2>
          <ol class="govuk-list govuk-list--number">
            <li>Sign in using your Solid identity</li>
            <li>Review your PIP benefit details</li>
            <li>Generate a secure digital credential</li>
            <li>Store it in your personal data pod</li>
            <li>Share with approved services as needed</li>
          </ol>
        </div>

        <div class="govuk-grid-column-one-third">
          <div class="govuk-inset-text">
            <p><strong>New to digital credentials?</strong></p>
            <p>Digital credentials are a secure way to prove your entitlements online without sharing sensitive personal information.</p>
          </div>
        </div>
      </div>
    </main>
  </div>

  <footer class="govuk-footer" role="contentinfo">
    <div class="govuk-width-container">
      <div class="govuk-footer__meta">
        <div class="govuk-footer__meta-item govuk-footer__meta-item--grow">
          <h2 class="govuk-footer__heading">Support links</h2>
          <ul class="govuk-footer__list">
            <li class="govuk-footer__list-item"><a class="govuk-footer__link" href="#">Help</a></li>
            <li class="govuk-footer__list-item"><a class="govuk-footer__link" href="#">Privacy</a></li>
            <li class="govuk-footer__list-item"><a class="govuk-footer__link" href="#">Cookies</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://design-system.service.gov.uk/javascripts/govuk-frontend-4.7.0.min.js"></script>
  <script>window.GOVUKFrontend.initAll()</script>
</body>
</html>`;
}

/**
 * Generate the login page HTML
 */
function generateLoginPage() {
    return `
<!DOCTYPE html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <title>Sign in - PIP VC Service - GOV.UK</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="stylesheet" href="https://design-system.service.gov.uk/stylesheets/govuk-frontend-4.7.0.min.css">
</head>
<body class="govuk-template__body">
  <header class="govuk-header" role="banner">
    <div class="govuk-header__container govuk-width-container">
      <div class="govuk-header__logo">
        <a href="/" class="govuk-header__link govuk-header__link--homepage">
          <span class="govuk-header__logotype">
            <span class="govuk-header__logotype-text">GOV.UK</span>
          </span>
        </a>
      </div>
      <div class="govuk-header__content">
        <a href="/" class="govuk-header__link govuk-header__service-name">
          PIP VC Service
        </a>
      </div>
    </div>
  </header>

  <div class="govuk-width-container">
    <main class="govuk-main-wrapper" id="main-content" role="main">
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds">
          <h1 class="govuk-heading-xl">Sign in to PIP VC Service</h1>
          
          <p class="govuk-body">You'll need your Solid identity to access this service.</p>
          
          <div class="govuk-inset-text">
            <p>This service uses Solid OIDC for secure authentication. Your credentials are stored in your own personal data store.</p>
          </div>

          <form id="loginForm">
            <div class="govuk-form-group">
              <label class="govuk-label govuk-label--m" for="webid">
                Your WebID
              </label>
              <div class="govuk-hint">
                For example: https://user.example.org/profile/card#me
              </div>
              <input class="govuk-input" id="webid" name="webid" type="url" value="https://user.example.org/profile/card#me">
            </div>

            <button class="govuk-button" type="submit" id="loginButton">
              Sign in with Solid
            </button>
          </form>

          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">Don't have a Solid identity?</span>
            </summary>
            <div class="govuk-details__text">
              <p>You'll need to register with a Solid identity provider first.</p>
              <p><a href="#" class="govuk-link">Find out how to get a Solid identity</a></p>
            </div>
          </details>
        </div>
      </div>
    </main>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const button = document.getElementById('loginButton');
      button.textContent = 'Signing in...';
      button.disabled = true;
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            redirect_uri: window.location.origin + '/auth/callback'
          })
        });
        
        const data = await response.json();
        
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          // For mock demo, simulate successful login
          window.location.href = '/auth/callback?code=mock-auth-code';
        }
      } catch (error) {
        console.error('Login error:', error);
        button.textContent = 'Sign in with Solid';
        button.disabled = false;
        alert('Login failed. Please try again.');
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Generate the dashboard page HTML
 */
function generateDashboardPage(user) {
    return `
<!DOCTYPE html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <title>Dashboard - PIP VC Service - GOV.UK</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="stylesheet" href="https://design-system.service.gov.uk/stylesheets/govuk-frontend-4.7.0.min.css">
</head>
<body class="govuk-template__body">
  <header class="govuk-header" role="banner">
    <div class="govuk-header__container govuk-width-container">
      <div class="govuk-header__logo">
        <a href="/" class="govuk-header__link govuk-header__link--homepage">
          <span class="govuk-header__logotype">
            <span class="govuk-header__logotype-text">GOV.UK</span>
          </span>
        </a>
      </div>
      <div class="govuk-header__content">
        <a href="/" class="govuk-header__link govuk-header__service-name">
          PIP VC Service
        </a>
        <nav aria-label="Navigation menu" class="govuk-header__navigation">
          <ul class="govuk-header__navigation-list">
            <li class="govuk-header__navigation-item">
              <a class="govuk-header__navigation-link" href="/credentials">My Credentials</a>
            </li>
            <li class="govuk-header__navigation-item">
              <a class="govuk-header__navigation-link" href="#" onclick="logout()">Sign out</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <div class="govuk-width-container">
    <main class="govuk-main-wrapper" id="main-content" role="main">
      <h1 class="govuk-heading-xl">Your PIP Digital Credentials</h1>
      
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds">
          <p class="govuk-body-l">Manage your Personal Independence Payment digital credentials</p>
          
          <div class="govuk-summary-card">
            <div class="govuk-summary-card__title-wrapper">
              <h2 class="govuk-summary-card__title">Your PIP Award</h2>
            </div>
            <div class="govuk-summary-card__content">
              <dl class="govuk-summary-list" id="benefitDetails">
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Loading...</dt>
                  <dd class="govuk-summary-list__value">Please wait</dd>
                </div>
              </dl>
            </div>
          </div>

          <div class="govuk-button-group">
            <a href="/vc-preview" class="govuk-button">Preview credential</a>
            <button class="govuk-button govuk-button--secondary" onclick="issueCredential()">Issue credential</button>
          </div>
        </div>

        <div class="govuk-grid-column-one-third">
          <div class="govuk-inset-text">
            <p><strong>Your WebID:</strong><br>
            <code style="word-break: break-all;">${user.webid}</code></p>
          </div>
        </div>
      </div>

      <div id="issueResult" style="display: none;" class="govuk-notification-banner govuk-notification-banner--success">
        <div class="govuk-notification-banner__header">
          <h2 class="govuk-notification-banner__title">Success</h2>
        </div>
        <div class="govuk-notification-banner__content">
          <p class="govuk-notification-banner__heading">Credential issued successfully</p>
          <p class="govuk-body">Your PIP credential has been stored in your pod. You can now <a href="/credentials" class="govuk-link">view your credentials</a>.</p>
        </div>
      </div>
    </main>
  </div>

  <script>
    // Load benefit details
    async function loadBenefitDetails() {
      try {
        const token = localStorage.getItem('auth_token') || 'mock-token';
        const response = await fetch('/eligibility', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        
        const data = await response.json();
        
        const detailsHtml = \`
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">Benefit type</dt>
            <dd class="govuk-summary-list__value">\${data.benefitType}</dd>
          </div>
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">Weekly amount</dt>
            <dd class="govuk-summary-list__value">\${data.totalWeeklyAmount || data.amount}</dd>
          </div>
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">Assessment date</dt>
            <dd class="govuk-summary-list__value">\${new Date(data.assessmentDate).toLocaleDateString()}</dd>
          </div>
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">Next review</dt>
            <dd class="govuk-summary-list__value">\${new Date(data.nextReviewDate).toLocaleDateString()}</dd>
          </div>
        \`;
        
        document.getElementById('benefitDetails').innerHTML = detailsHtml;
      } catch (error) {
        console.error('Error loading benefit details:', error);
      }
    }

    // Issue credential
    async function issueCredential() {
      try {
        const token = localStorage.getItem('auth_token') || 'mock-token';
        const response = await fetch('/vc/issue', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ confirm: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('issueResult').style.display = 'block';
          window.scrollTo(0, 0);
        }
      } catch (error) {
        console.error('Error issuing credential:', error);
        alert('Failed to issue credential. Please try again.');
      }
    }

    // Logout
    function logout() {
      localStorage.removeItem('auth_token');
      fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/';
    }

    // Load data on page load
    loadBenefitDetails();
  </script>
</body>
</html>`;
}

/**
 * Generate the VC preview page HTML
 */
function generateVcPreviewPage(user) {
    return `
<!DOCTYPE html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <title>Preview Credential - PIP VC Service - GOV.UK</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="stylesheet" href="https://design-system.service.gov.uk/stylesheets/govuk-frontend-4.7.0.min.css">
</head>
<body class="govuk-template__body">
  <header class="govuk-header" role="banner">
    <div class="govuk-header__container govuk-width-container">
      <div class="govuk-header__logo">
        <a href="/" class="govuk-header__link govuk-header__link--homepage">
          <span class="govuk-header__logotype">
            <span class="govuk-header__logotype-text">GOV.UK</span>
          </span>
        </a>
      </div>
      <div class="govuk-header__content">
        <a href="/" class="govuk-header__link govuk-header__service-name">
          PIP VC Service
        </a>
      </div>
    </div>
  </header>

  <div class="govuk-width-container">
    <a href="/dashboard" class="govuk-back-link">Back to dashboard</a>
    
    <main class="govuk-main-wrapper" id="main-content" role="main">
      <h1 class="govuk-heading-xl">Preview your credential</h1>
      
      <div class="govuk-tabs" data-module="govuk-tabs">
        <h2 class="govuk-tabs__title">Contents</h2>
        <ul class="govuk-tabs__list">
          <li class="govuk-tabs__list-item govuk-tabs__list-item--selected">
            <a class="govuk-tabs__tab" href="#summary">Summary</a>
          </li>
          <li class="govuk-tabs__list-item">
            <a class="govuk-tabs__tab" href="#json-ld">JSON-LD</a>
          </li>
          <li class="govuk-tabs__list-item">
            <a class="govuk-tabs__tab" href="#turtle">Turtle</a>
          </li>
        </ul>
        
        <div class="govuk-tabs__panel" id="summary">
          <h2 class="govuk-heading-l">Credential summary</h2>
          <div id="vcSummary">Loading...</div>
        </div>
        
        <div class="govuk-tabs__panel govuk-tabs__panel--hidden" id="json-ld">
          <h2 class="govuk-heading-l">JSON-LD format</h2>
          <pre class="govuk-body-s" style="background: #f3f2f1; padding: 20px; overflow-x: auto;"><code id="jsonLdContent">Loading...</code></pre>
        </div>
        
        <div class="govuk-tabs__panel govuk-tabs__panel--hidden" id="turtle">
          <h2 class="govuk-heading-l">Turtle format</h2>
          <pre class="govuk-body-s" style="background: #f3f2f1; padding: 20px; overflow-x: auto;"><code id="turtleContent">Loading...</code></pre>
        </div>
      </div>
    </main>
  </div>

  <script src="https://design-system.service.gov.uk/javascripts/govuk-frontend-4.7.0.min.js"></script>
  <script>
    window.GOVUKFrontend.initAll();

    // Load VC preview
    async function loadVcPreview() {
      try {
        const token = localStorage.getItem('auth_token') || 'mock-token';
        const response = await fetch('/vc/preview', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        
        const data = await response.json();
        
        // Update summary
        const summaryHtml = \`
          <dl class="govuk-summary-list">
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Credential ID</dt>
              <dd class="govuk-summary-list__value"><code>\${data.id}</code></dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Issuer</dt>
              <dd class="govuk-summary-list__value">\${data.metadata.issuer}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Subject</dt>
              <dd class="govuk-summary-list__value"><code>\${data.metadata.subject}</code></dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Benefit type</dt>
              <dd class="govuk-summary-list__value">\${data.metadata.benefitType}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Amount</dt>
              <dd class="govuk-summary-list__value">\${data.metadata.amount}</dd>
            </div>
          </dl>
        \`;
        document.getElementById('vcSummary').innerHTML = summaryHtml;
        
        // Update JSON-LD
        document.getElementById('jsonLdContent').textContent = JSON.stringify(data.formats['application/ld+json'], null, 2);
        
        // Update Turtle
        document.getElementById('turtleContent').textContent = data.formats['text/turtle'];
        
      } catch (error) {
        console.error('Error loading VC preview:', error);
      }
    }

    loadVcPreview();
  </script>
</body>
</html>`;
}

/**
 * Generate the credentials management page HTML
 */
function generateCredentialsPage(user) {
    return `
<!DOCTYPE html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <title>My Credentials - PIP VC Service - GOV.UK</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="stylesheet" href="https://design-system.service.gov.uk/stylesheets/govuk-frontend-4.7.0.min.css">
</head>
<body class="govuk-template__body">
  <header class="govuk-header" role="banner">
    <div class="govuk-header__container govuk-width-container">
      <div class="govuk-header__logo">
        <a href="/" class="govuk-header__link govuk-header__link--homepage">
          <span class="govuk-header__logotype">
            <span class="govuk-header__logotype-text">GOV.UK</span>
          </span>
        </a>
      </div>
      <div class="govuk-header__content">
        <a href="/" class="govuk-header__link govuk-header__service-name">
          PIP VC Service
        </a>
      </div>
    </div>
  </header>

  <div class="govuk-width-container">
    <a href="/dashboard" class="govuk-back-link">Back to dashboard</a>
    
    <main class="govuk-main-wrapper" id="main-content" role="main">
      <h1 class="govuk-heading-xl">Your credentials</h1>
      
      <div id="credentialsList">Loading...</div>
    </main>
  </div>

  <script>
    // Load credentials list
    async function loadCredentials() {
      try {
        const token = localStorage.getItem('auth_token') || 'mock-token';
        const response = await fetch('/vc/list', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        
        const data = await response.json();
        
        let html = \`<p class="govuk-body">You have \${data.totalCount} credential(s), \${data.activeCount} active.</p>\`;
        
        data.credentials.forEach(cred => {
          const statusTag = cred.status === 'active' 
            ? '<strong class="govuk-tag govuk-tag--green">Active</strong>'
            : '<strong class="govuk-tag govuk-tag--grey">Superseded</strong>';
            
          html += \`
            <div class="govuk-summary-card">
              <div class="govuk-summary-card__title-wrapper">
                <h2 class="govuk-summary-card__title">\${cred.benefitType} Benefit Credential</h2>
                <ul class="govuk-summary-card__actions">
                  <li class="govuk-summary-card__action">
                    <a class="govuk-link" href="#" onclick="viewCredential('\${cred.id}')">View<span class="govuk-visually-hidden"> \${cred.id}</span></a>
                  </li>
                  \${cred.status === 'active' ? \`
                  <li class="govuk-summary-card__action">
                    <a class="govuk-link" href="#" onclick="revokeCredential('\${cred.id}')">Revoke<span class="govuk-visually-hidden"> \${cred.id}</span></a>
                  </li>
                  \` : ''}
                </ul>
              </div>
              <div class="govuk-summary-card__content">
                <dl class="govuk-summary-list">
                  <div class="govuk-summary-list__row">
                    <dt class="govuk-summary-list__key">Status</dt>
                    <dd class="govuk-summary-list__value">\${statusTag}</dd>
                  </div>
                  <div class="govuk-summary-list__row">
                    <dt class="govuk-summary-list__key">Amount</dt>
                    <dd class="govuk-summary-list__value">\${cred.amount}</dd>
                  </div>
                  <div class="govuk-summary-list__row">
                    <dt class="govuk-summary-list__key">Issued</dt>
                    <dd class="govuk-summary-list__value">\${new Date(cred.issuanceDate).toLocaleDateString()}</dd>
                  </div>
                  <div class="govuk-summary-list__row">
                    <dt class="govuk-summary-list__key">ID</dt>
                    <dd class="govuk-summary-list__value"><code>\${cred.id}</code></dd>
                  </div>
                </dl>
              </div>
            </div>
          \`;
        });
        
        document.getElementById('credentialsList').innerHTML = html;
        
      } catch (error) {
        console.error('Error loading credentials:', error);
        document.getElementById('credentialsList').innerHTML = '<p class="govuk-body">Error loading credentials.</p>';
      }
    }

    function viewCredential(id) {
      // In a real implementation, this would show detailed credential view
      alert('View credential: ' + id);
    }

    function revokeCredential(id) {
      if (confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
        // Implementation for revoking credential
        alert('Credential revoked: ' + id);
      }
    }

    loadCredentials();
  </script>
</body>
</html>`;
}

module.exports = router;
