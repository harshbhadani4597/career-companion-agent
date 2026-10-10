"""
DOCX Resume Generator Service
Generates professional ATS-friendly Word document (.docx) resumes
matching the exact single-column clean layout template without external dependencies.
"""

import io
import re
import html
import zipfile
from typing import Dict, List, Any


def xml_escape(text: Any) -> str:
    """Escape special characters for safe inclusion in OpenXML text nodes."""
    if text is None:
        return ""
    text_str = str(text)
    # XML entity escaping
    return (
        text_str.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


class DocxResumeGenerator:
    """Builds ATS-optimized .docx resume documents using OpenXML standards."""

    PAGE_WIDTH = 12240   # 8.5 inches in dxa (1 inch = 1440 dxa)
    PAGE_HEIGHT = 15840  # 11 inches in dxa
    MARGIN_LR = 720      # 0.5 inches
    MARGIN_TB = 720      # 0.5 inches
    CONTENT_WIDTH = PAGE_WIDTH - (MARGIN_LR * 2)  # 10800 dxa

    def generate(self, resume_data: Dict[str, Any]) -> bytes:
        """
        Generate a complete .docx binary file for the given resume structure.
        """
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as docx:
            docx.writestr("[Content_Types].xml", self._get_content_types_xml())
            docx.writestr("_rels/.rels", self._get_rels_xml())
            docx.writestr("word/_rels/document.xml.rels", self._get_doc_rels_xml())
            docx.writestr("word/styles.xml", self._get_styles_xml())
            docx.writestr("word/document.xml", self._get_document_xml(resume_data))

        return buf.getvalue()

    def _get_content_types_xml(self) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n'
            '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n'
            '  <Default Extension="xml" ContentType="application/xml"/>\n'
            '  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n'
            '  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>\n'
            "</Types>"
        )

    def _get_rels_xml(self) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n'
            '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n'
            "</Relationships>"
        )

    def _get_doc_rels_xml(self) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n'
            '  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>\n'
            "</Relationships>"
        )

    def _get_styles_xml(self) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n'
            '  <w:docDefaults>\n'
            "    <w:rPrDefault>\n"
            "      <w:rPr>\n"
            '        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>\n'
            '        <w:sz w:val="21"/>\n'  # 10.5 pt
            '        <w:szCs w:val="21"/>\n'
            '        <w:color w:val="000000"/>\n'
            "      </w:rPr>\n"
            "    </w:rPrDefault>\n"
            "    <w:pPrDefault>\n"
            "      <w:pPr>\n"
            '        <w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="40"/>\n'
            "      </w:pPr>\n"
            "    </w:pPrDefault>\n"
            "  </w:docDefaults>\n"
            "</w:styles>"
        )

    def _get_document_xml(self, data: Dict[str, Any]) -> str:
        header = data.get("header", {})
        name = xml_escape(header.get("name", "HARSH KUMAR BHADANI"))
        title = xml_escape(header.get("title") or header.get("headline", "AI/ML & Generative AI Developer | Full-Stack Developer | B.Tech CSE (AI & ML)"))
        
        # Contact line
        contact_parts = []
        if header.get("location"):
            contact_parts.append(xml_escape(header["location"]))
        if header.get("phone"):
            contact_parts.append(xml_escape(header["phone"]))
        if header.get("email"):
            contact_parts.append(xml_escape(header["email"]))
        if header.get("linkedin"):
            contact_parts.append("LinkedIn")
        if header.get("github"):
            contact_parts.append("GitHub")
        contact_str = " | ".join(contact_parts) if contact_parts else "Koderma, Jharkhand | +91 5765656655 | kumarharsh6754@gmail.com | LinkedIn | GitHub"

        summary = xml_escape(data.get("summary") or data.get("professional_summary", ""))
        skills = data.get("technical_skills", [])
        projects = data.get("projects", [])
        experiences = data.get("experience", [])
        education = data.get("education", [])
        certifications = data.get("certifications", "")
        achievements = data.get("achievements", [])

        # Build paragraphs
        p_list = []

        # ── HEADER ──
        # Candidate Name
        p_list.append(
            f'<w:p>'
            f'<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="30"/></w:pPr>'
            f'<w:r><w:rPr><w:b/><w:sz w:val="34"/><w:szCs w:val="34"/></w:rPr><w:t>{name}</w:t></w:r>'
            f'</w:p>'
        )

        # Candidate Title
        if title:
            p_list.append(
                f'<w:p>'
                f'<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="30"/></w:pPr>'
                f'<w:r><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>{title}</w:t></w:r>'
                f'</w:p>'
            )

        # Contact Info Bar
        p_list.append(
            f'<w:p>'
            f'<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="140"/></w:pPr>'
            f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{contact_str}</w:t></w:r>'
            f'</w:p>'
        )

        # Helper for Section Heading
        def add_heading(title_text: str):
            p_list.append(
                f'<w:p>'
                f'<w:pPr>'
                f'<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr>'
                f'<w:spacing w:before="120" w:after="50"/>'
                f'</w:pPr>'
                f'<w:r><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>{xml_escape(title_text)}</w:t></w:r>'
                f'</w:p>'
            )

        # Helper for Two-column line (Title on left, Meta/Date on right)
        def add_two_column_line(left_text: str, right_text: str, is_bold: bool = True):
            bold_xml = "<w:b/>" if is_bold else ""
            p_list.append(
                f'<w:p>'
                f'<w:pPr>'
                f'<w:tabs><w:tab w:val="right" w:pos="{self.CONTENT_WIDTH}"/></w:tabs>'
                f'<w:spacing w:before="60" w:after="20"/>'
                f'</w:pPr>'
                f'<w:r><w:rPr>{bold_xml}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{xml_escape(left_text)}</w:t></w:r>'
                f'<w:r><w:tab/></w:r>'
                f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{xml_escape(right_text)}</w:t></w:r>'
                f'</w:p>'
            )

        # Helper for bullet point
        def add_bullet(bullet_text: str):
            clean_text = xml_escape(re.sub(r'^[•\-\*]\s*', '', bullet_text.strip()))
            p_list.append(
                f'<w:p>'
                f'<w:pPr>'
                f'<w:ind w:left="280" w:hanging="200"/>'
                f'<w:spacing w:before="0" w:after="25"/>'
                f'</w:pPr>'
                f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>• </w:t></w:r>'
                f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{clean_text}</w:t></w:r>'
                f'</w:p>'
            )

        # ── PROFESSIONAL SUMMARY ──
        if summary:
            add_heading("PROFESSIONAL SUMMARY")
            p_list.append(
                f'<w:p>'
                f'<w:pPr><w:spacing w:before="30" w:after="60"/><w:jc w:val="both"/></w:pPr>'
                f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{summary}</w:t></w:r>'
                f'</w:p>'
            )

        # ── TECHNICAL SKILLS ──
        if skills:
            add_heading("TECHNICAL SKILLS")
            if isinstance(skills, list):
                for sk in skills:
                    if isinstance(sk, dict):
                        cat = xml_escape(sk.get("category", ""))
                        items = xml_escape(sk.get("skills", ""))
                        p_list.append(
                            f'<w:p>'
                            f'<w:pPr><w:spacing w:before="20" w:after="25"/></w:pPr>'
                            f'<w:r><w:rPr><w:b/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{cat}: </w:t></w:r>'
                            f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{items}</w:t></w:r>'
                            f'</w:p>'
                        )
                    else:
                        # Raw string format like "Category: skills"
                        sk_str = str(sk)
                        if ":" in sk_str:
                            cat, rest = sk_str.split(":", 1)
                            p_list.append(
                                f'<w:p>'
                                f'<w:pPr><w:spacing w:before="20" w:after="25"/></w:pPr>'
                                f'<w:r><w:rPr><w:b/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{xml_escape(cat.strip())}: </w:t></w:r>'
                                f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{xml_escape(rest.strip())}</w:t></w:r>'
                                f'</w:p>'
                            )
                        else:
                            p_list.append(
                                f'<w:p><w:pPr><w:spacing w:after="20"/></w:pPr><w:r><w:rPr><w:sz w:val="19"/></w:rPr><w:t>{xml_escape(sk_str)}</w:t></w:r></w:p>'
                            )

        # ── PROJECTS ──
        if projects:
            add_heading("PROJECTS")
            for proj in projects:
                title = proj.get("title", "")
                link = proj.get("link_text") or proj.get("link", "Project Link (GitHub)")
                stack = proj.get("tech_stack", "")
                if isinstance(stack, list):
                    stack = ", ".join(stack)

                add_two_column_line(title, link, is_bold=True)
                if stack:
                    p_list.append(
                        f'<w:p>'
                        f'<w:pPr><w:spacing w:before="0" w:after="20"/></w:pPr>'
                        f'<w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="222222"/></w:rPr><w:t>{xml_escape(stack)}</w:t></w:r>'
                        f'</w:p>'
                    )

                bullets = proj.get("bullets", [])
                if not bullets and proj.get("description"):
                    bullets = [proj["description"]]
                for b in bullets:
                    add_bullet(b)

        # ── INTERNSHIP EXPERIENCE ──
        if experiences:
            add_heading("INTERNSHIP EXPERIENCE")
            for exp in experiences:
                role = exp.get("role") or exp.get("title") or exp.get("company_role", "")
                meta = exp.get("meta") or exp.get("location_domain") or "Artificial Intelligence | Virtual"
                add_two_column_line(role, meta, is_bold=True)

                bullets = exp.get("bullets", [])
                if not bullets and exp.get("description"):
                    bullets = [exp["description"]]
                for b in bullets:
                    add_bullet(b)

        # ── EDUCATION ──
        if education:
            add_heading("EDUCATION")
            for edu in education:
                degree = edu.get("degree", "")
                grad = edu.get("graduation") or edu.get("year", "Graduation: 2027")
                if grad and not grad.lower().startswith("grad"):
                    grad = f"Graduation: {grad}"
                inst = edu.get("institution", "")

                add_two_column_line(degree, grad, is_bold=True)
                if inst:
                    p_list.append(
                        f'<w:p>'
                        f'<w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr>'
                        f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{xml_escape(inst)}</w:t></w:r>'
                        f'</w:p>'
                    )

        # ── CERTIFICATIONS ──
        if certifications:
            add_heading("CERTIFICATIONS")
            cert_str = certifications
            if isinstance(certifications, list):
                cert_str = "; ".join(certifications)
            p_list.append(
                f'<w:p>'
                f'<w:pPr><w:spacing w:before="30" w:after="50"/><w:jc w:val="both"/></w:pPr>'
                f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{xml_escape(cert_str)}</w:t></w:r>'
                f'</w:p>'
            )

        # ── ACHIEVEMENTS & ACTIVITIES ──
        if achievements:
            add_heading("ACHIEVEMENTS & ACTIVITIES")
            for ach in achievements:
                add_bullet(ach)

        # Page setup xml
        sect_pr = (
            f'<w:sectPr>'
            f'<w:pgSz w:w="{self.PAGE_WIDTH}" w:h="{self.PAGE_HEIGHT}"/>'
            f'<w:pgMar w:top="{self.MARGIN_TB}" w:right="{self.MARGIN_LR}" w:bottom="{self.MARGIN_TB}" w:left="{self.MARGIN_LR}"/>'
            f'</w:sectPr>'
        )

        body_xml = "".join(p_list) + sect_pr
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n'
            f'  <w:body>{body_xml}</w:body>\n'
            "</w:document>"
        )

    def generate_cover_letter(self, data: Dict[str, Any]) -> bytes:
        """
        Generate a complete .docx binary file for the given cover letter structure.
        """
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as docx:
            docx.writestr("[Content_Types].xml", self._get_content_types_xml())
            docx.writestr("_rels/.rels", self._get_rels_xml())
            docx.writestr("word/_rels/document.xml.rels", self._get_doc_rels_xml())
            docx.writestr("word/styles.xml", self._get_styles_xml())
            docx.writestr("word/document.xml", self._get_cover_letter_document_xml(data))

        return buf.getvalue()

    def _get_cover_letter_document_xml(self, data: Dict[str, Any]) -> str:
        header = data.get("header", {})
        name = xml_escape(header.get("name", "HARSH KUMAR BHADANI"))

        contact_parts = []
        if header.get("location"):
            contact_parts.append(xml_escape(header["location"]))
        if header.get("phone"):
            contact_parts.append(xml_escape(header["phone"]))
        if header.get("email"):
            contact_parts.append(xml_escape(header["email"]))
        if header.get("linkedin"):
            contact_parts.append("LinkedIn")
        if header.get("github"):
            contact_parts.append("GitHub")
        contact_str = " | ".join(contact_parts) if contact_parts else "Koderma, Jharkhand | +91 5765656655 | kumarharsh6754@gmail.com | LinkedIn | GitHub"

        date_str = xml_escape(data.get("date", "October 4, 2026"))
        recipient = data.get("recipient", {})
        mgr_name = xml_escape(recipient.get("name", "Hiring Team"))
        company_name = xml_escape(recipient.get("company", "Company Name"))
        company_addr = xml_escape(recipient.get("address", "Company Address / City"))

        subject = xml_escape(data.get("subject", f"Subject: Application for Role – {name}"))
        salutation = xml_escape(data.get("salutation", f"Dear {mgr_name},"))

        paragraphs = data.get("paragraphs", [])
        if not paragraphs and data.get("body"):
            paragraphs = [p.strip() for p in data["body"].split("\n\n") if p.strip()]

        signoff = xml_escape(data.get("signoff", "Yours sincerely,"))
        signature_name = xml_escape(data.get("signature_name", name))

        p_list = []

        # ── HEADER ──
        p_list.append(
            f'<w:p>'
            f'<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="30"/></w:pPr>'
            f'<w:r><w:rPr><w:b/><w:sz w:val="34"/><w:szCs w:val="34"/></w:rPr><w:t>{name}</w:t></w:r>'
            f'</w:p>'
        )

        p_list.append(
            f'<w:p>'
            f'<w:pPr>'
            f'<w:jc w:val="center"/>'
            f'<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="000000"/></w:pBdr>'
            f'<w:spacing w:before="0" w:after="160"/>'
            f'</w:pPr>'
            f'<w:r><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t>{contact_str}</w:t></w:r>'
            f'</w:p>'
        )

        # ── DATE ──
        p_list.append(
            f'<w:p>'
            f'<w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>'
            f'<w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>{date_str}</w:t></w:r>'
            f'</w:p>'
        )

        # ── RECIPIENT BLOCK ──
        if mgr_name:
            p_list.append(f'<w:p><w:pPr><w:spacing w:before="0" w:after="30"/></w:pPr><w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t>{mgr_name}</w:t></w:r></w:p>')
        if company_name:
            p_list.append(f'<w:p><w:pPr><w:spacing w:before="0" w:after="30"/></w:pPr><w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t>{company_name}</w:t></w:r></w:p>')
        if company_addr:
            p_list.append(f'<w:p><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr><w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t>{company_addr}</w:t></w:r></w:p>')

        # ── SUBJECT LINE ──
        if subject:
            p_list.append(
                f'<w:p>'
                f'<w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr>'
                f'<w:r><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>{subject}</w:t></w:r>'
                f'</w:p>'
            )

        # ── SALUTATION ──
        if salutation:
            p_list.append(
                f'<w:p>'
                f'<w:pPr><w:spacing w:before="60" w:after="100"/></w:pPr>'
                f'<w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>{salutation}</w:t></w:r>'
                f'</w:p>'
            )

        # ── BODY PARAGRAPHS ──
        for para in paragraphs:
            p_clean = xml_escape(para.strip())
            p_list.append(
                f'<w:p>'
                f'<w:pPr><w:spacing w:before="50" w:after="100"/><w:jc w:val="both"/></w:pPr>'
                f'<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{p_clean}</w:t></w:r>'
                f'</w:p>'
            )

        # ── SIGN-OFF ──
        p_list.append(
            f'<w:p>'
            f'<w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>'
            f'<w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>{signoff}</w:t></w:r>'
            f'</w:p>'
        )

        p_list.append(
            f'<w:p>'
            f'<w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr>'
            f'<w:r><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>{signature_name}</w:t></w:r>'
            f'</w:p>'
        )

        sect_pr = (
            f'<w:sectPr>'
            f'<w:pgSz w:w="{self.PAGE_WIDTH}" w:h="{self.PAGE_HEIGHT}"/>'
            f'<w:pgMar w:top="{self.MARGIN_TB}" w:right="{self.MARGIN_LR}" w:bottom="{self.MARGIN_TB}" w:left="{self.MARGIN_LR}"/>'
            f'</w:sectPr>'
        )

        body_xml = "".join(p_list) + sect_pr
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n'
            f'  <w:body>{body_xml}</w:body>\n'
            "</w:document>"
        )
