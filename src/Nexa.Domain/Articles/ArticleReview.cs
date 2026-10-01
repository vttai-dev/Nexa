using Nexa.Domain.Common;

namespace Nexa.Domain.Articles;

public sealed class ArticleReview : Entity
{
    private ArticleReview() { }

    public ArticleReview(Guid articleId, Guid authorId, Guid articleVersion, string? submissionNote,
        DateTimeOffset submittedAtUtc)
    {
        ArticleId = Guard.Identifier(articleId, "Article");
        AuthorId = Guard.Identifier(authorId, "Author");
        ArticleVersion = Guard.Identifier(articleVersion, "Article version");
        SubmissionNote = string.IsNullOrWhiteSpace(submissionNote) ? null : Guard.Text(submissionNote, 2000, "Submission note");
        SubmittedAtUtc = submittedAtUtc;
        Status = ArticleReviewStatus.Pending;
    }

    public Guid ArticleId { get; private set; }
    public Guid AuthorId { get; private set; }
    public Guid ArticleVersion { get; private set; }
    public string? SubmissionNote { get; private set; }
    public ArticleReviewStatus Status { get; private set; }
    public Guid? ReviewerId { get; private set; }
    public string? ReviewNote { get; private set; }
    public DateTimeOffset SubmittedAtUtc { get; private set; }
    public DateTimeOffset? ReviewedAtUtc { get; private set; }

    public void Decide(Guid reviewerId, ArticleReviewStatus decision, string? note, DateTimeOffset now)
    {
        if (Status != ArticleReviewStatus.Pending)
            throw new DomainException("Only pending review requests can be decided.");
        if (decision is not (ArticleReviewStatus.Approved or ArticleReviewStatus.Rejected))
            throw new DomainException("A review decision must be Approved or Rejected.");
        ReviewerId = Guard.Identifier(reviewerId, "Reviewer");
        ReviewNote = string.IsNullOrWhiteSpace(note) ? null : Guard.Text(note, 2000, "Review note");
        Status = decision;
        ReviewedAtUtc = now;
    }

    public void Withdraw(Guid authorId, DateTimeOffset now)
    {
        if (Status != ArticleReviewStatus.Pending || AuthorId != authorId)
            throw new DomainException("Only the author can withdraw a pending review request.");
        Status = ArticleReviewStatus.Withdrawn;
        ReviewedAtUtc = now;
    }
}
