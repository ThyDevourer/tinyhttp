import { contentDisposition, parse, ContentDisposition } from '../../packages/content-disposition/src'

describe('contentDisposition()', () => {
  it('should create an attachment header', () => {
    expect(contentDisposition()).toBe('attachment')
  })
})

describe('contentDisposition(filename)', () => {
  it('should require a string', () => {
    expect(contentDisposition.bind(null, 42)).toThrow(/filename.*string/)
  })

  it('should create a header with file name', () => {
    expect(contentDisposition('plans.pdf')).toBe('attachment; filename="plans.pdf"')
  })

  it('should use the basename of the string', () => {
    expect(contentDisposition('/path/to/plans.pdf')).toBe('attachment; filename="plans.pdf"')
  })

  describe('when "filename" is US-ASCII', () => {
    it('should only include filename parameter', () => {
      expect(contentDisposition('plans.pdf')).toBe('attachment; filename="plans.pdf"')
    })

    it('should escape quotes', () => {
      expect(contentDisposition('the "plans".pdf')).toBe('attachment; filename="the \\"plans\\".pdf"')
    })
  })
})

describe('parse(string)', () => {
  it('should require a string', () => {
    try {
      parse(null as string)
    } catch (e) {
      expect(e.message).toBe('argument string is required')
    }
  })
  describe('with type', () => {
    it('should throw on quoted value', () => {
      try {
        parse('"attachment"')
      } catch (e) {
        expect(e.message).toBe('invalid type format')
      }
    })
    it('should throw on trailing semi', () => {
      try {
        parse('attachment;')
      } catch (e) {
        expect(e.message).toBe('invalid parameter format')
      }
    })
    it('should parse "attachment"', () => {
      expect(parse('attachment')).toStrictEqual(new ContentDisposition('attachment', {}))
    })
    it('should parse "inline"', () => {
      expect(parse('inline')).toStrictEqual(new ContentDisposition('inline', {}))
    })
    it('should parse "form-data"', () => {
      expect(parse('form-data')).toStrictEqual(new ContentDisposition('form-data', {}))
    })
    it('should parse with trailing LWS', () => {
      expect(parse('attachment \t ')).toStrictEqual(new ContentDisposition('attachment', {}))
    })
    it('should normalize to lower-case', () => {
      expect(parse('ATTACHMENT')).toStrictEqual(new ContentDisposition('attachment', {}))
    })
  })
  describe('with parameters', () => {
    it('should throw on trailing semi', () => {
      try {
        parse('attachment; filename="rates.pdf";')
      } catch (e) {
        expect(e.message).toBe('invalid parameter format')
      }
    })
    it('should throw on invalid param name', () => {
      try {
        parse('attachment; filename@="rates.pdf"')
      } catch (e) {
        expect(e.message).toBe('invalid parameter format')
      }
    })
    it('should throw on missing param value', () => {
      try {
        parse('attachment; filename=')
      } catch (e) {
        expect(e.message).toBe('invalid parameter format')
      }
    })

    it('should reject invalid parameter value', function () {
      try {
        parse('attachment; filename=trolly,trains')
      } catch (e) {
        expect(e.message).toMatch(/invalid parameter format/)
      }
    })

    it('should reject invalid parameters', function () {
      try {
        parse('attachment; filename=total/; foo=bar')
      } catch (e) {
        expect(e.message).toMatch(/invalid parameter format/)
      }
    })

    it('should reject duplicate parameters', function () {
      try {
        parse('attachment; filename=foo; filename=bar')
      } catch (e) {
        expect(e.message).toMatch(/invalid duplicate parameter/)
      }
    })

    it('should reject missing type', function () {
      try {
        parse('filename="plans.pdf"')
      } catch (e) {
        expect(e.message).toMatch(/invalid type format/)
      }

      try {
        parse('; filename="plans.pdf"')
      } catch (e) {
        expect(e.message).toMatch(/invalid type format/)
      }
    })

    it('should lower-case parameter name', () => {
      expect(parse('attachment; FILENAME="plans.pdf"')).toStrictEqual(
        new ContentDisposition('attachment', { filename: 'plans.pdf' })
      )
    })

    it('should parse quoted parameter value', function () {
      expect(parse('attachment; filename="plans.pdf"')).toEqual({
        type: 'attachment',
        parameters: { filename: 'plans.pdf' }
      })
    })

    it('should parse & unescape quoted value', function () {
      expect(parse('attachment; filename="the \\"plans\\".pdf"')).toEqual({
        type: 'attachment',
        parameters: { filename: 'the "plans".pdf' }
      })
    })

    it('should include all parameters', function () {
      expect(parse('attachment; filename="plans.pdf"; foo=bar')).toEqual({
        type: 'attachment',
        parameters: { filename: 'plans.pdf', foo: 'bar' }
      })
    })

    it('should parse parameters separated with any LWS', function () {
      expect(parse('attachment;filename="plans.pdf" \t;    \t\t foo=bar')).toEqual({
        type: 'attachment',
        parameters: { filename: 'plans.pdf', foo: 'bar' }
      })
    })

    it('should parse token filename', function () {
      expect(parse('attachment; filename=plans.pdf')).toEqual({
        type: 'attachment',
        parameters: { filename: 'plans.pdf' }
      })
    })

    it('should parse ISO-8859-1 filename', function () {
      expect(parse('attachment; filename="£ rates.pdf"')).toEqual({
        type: 'attachment',
        parameters: { filename: '£ rates.pdf' }
      })
    })
  })
  describe('with extended parameters', function () {
    it('should reject quoted extended parameter value', function () {
      try {
        parse('attachment; filename*="UTF-8\'\'%E2%82%AC%20rates.pdf"')
      } catch (e) {
        expect(e.message).toMatch(/invalid extended.*value/)
      }
    })

    it('should parse UTF-8 extended parameter value', function () {
      expect(parse("attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf")).toEqual({
        type: 'attachment',
        parameters: { filename: '€ rates.pdf' }
      })
    })
  })
})
